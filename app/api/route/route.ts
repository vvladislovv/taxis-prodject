import { NextRequest, NextResponse } from 'next/server'

// Простое кэширование в памяти (для production лучше использовать Redis)
const routeCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

// Debounce для предотвращения множественных запросов
let pendingRequests = new Map<string, Promise<any>>()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get('from') // format: "lat,lng"
  const to = searchParams.get('to') // format: "lat,lng"
  const alternatives = searchParams.get('alternatives') === 'true'
  const overview = searchParams.get('overview') || 'full'
  
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to parameters are required' }, { status: 400 })
  }

  // Проверяем, что координаты не одинаковые
  if (from === to) {
    // Возвращаем пустой маршрут для одинаковых точек
    return NextResponse.json({
      code: 'Ok',
      routes: [{
        distance: 0,
        duration: 0,
        geometry: {
          type: 'LineString',
          coordinates: [
            from.split(',').map(Number).reverse(), // [lon, lat]
            to.split(',').map(Number).reverse()
          ]
        }
      }]
    })
  }

  // Проверяем кэш
  const cacheKey = `${from}-${to}-${alternatives}-${overview}`
  const cached = routeCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  // Проверяем, есть ли уже pending запрос с такими же параметрами
  if (pendingRequests.has(cacheKey)) {
    const result = await pendingRequests.get(cacheKey)
    return NextResponse.json(result)
  }

  // Создаем новый запрос
  const requestPromise = fetchRoute(from, to, alternatives, overview)
  pendingRequests.set(cacheKey, requestPromise)

  try {
    const data = await requestPromise
    
    // Сохраняем в кэш
    routeCache.set(cacheKey, { data, timestamp: Date.now() })
    
    // Очищаем старые записи из кэша (простая очистка)
    if (routeCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of Array.from(routeCache.entries())) {
        if (now - value.timestamp > CACHE_TTL) {
          routeCache.delete(key)
        }
      }
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Route API error:', error)
    
    // Если OSRM недоступен, таймаут или ошибка сети, возвращаем fallback маршрут
    if (error.code === 'ECONNREFUSED' || 
        error.name === 'AbortError' ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('aborted')) {
      console.log('Using fallback route due to network error')
      return NextResponse.json(generateFallbackRoute(from, to))
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch route' },
      { status: 500 }
    )
  } finally {
    // Удаляем из pending после завершения
    pendingRequests.delete(cacheKey)
  }
}

async function fetchRoute(
  from: string,
  to: string,
  alternatives: boolean,
  overview: string
) {
  // Парсим координаты
  const [fromLat, fromLng] = from.split(',').map(Number)
  const [toLat, toLng] = to.split(',').map(Number)

  // Пробуем сначала GraphHopper (лучше для России), затем OSRM
  const providers = [
    {
      name: 'GraphHopper',
      url: `https://graphhopper.com/api/1/route?point=${fromLat},${fromLng}&point=${toLat},${toLng}&vehicle=car&locale=ru&key=demo&instructions=false&calc_points=true&points_encoded=false${alternatives ? '&alternative_route.max_paths=3' : ''}`,
      parser: parseGraphHopperResponse
    },
    {
      name: 'OSRM',
      url: `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=${overview}&geometries=geojson&alternatives=${alternatives ? 'true' : 'false'}`,
      parser: parseOSRMResponse
    }
  ]

  for (const provider of providers) {
    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд
      
      const response = await fetch(provider.url, {
        headers: {
          'User-Agent': 'TaxiApp/1.0',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        // Если 429, пробуем следующий провайдер
        if (response.status === 429) {
          console.log(`${provider.name} rate limited, trying next provider`)
          continue
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const parsed = provider.parser(data, alternatives)
      
      if (parsed) {
        console.log(`Route fetched successfully from ${provider.name}`)
        return parsed
      }
    } catch (error: any) {
      // Если это ошибка сети, таймаута или отмены запроса, пробуем следующий провайдер
      if (error.name === 'AbortError' || 
          error.code === 'ECONNREFUSED' || 
          error.message?.includes('fetch failed') ||
          error.message?.includes('aborted')) {
        console.log(`${provider.name} failed, trying next provider`)
        continue
      }
      // Для других ошибок тоже пробуем следующий провайдер
      console.log(`${provider.name} error:`, error.message)
      continue
    }
  }

  // Если все провайдеры не сработали, выбрасываем ошибку для fallback
  throw new Error('All routing providers failed')
}

// Парсер ответа GraphHopper
function parseGraphHopperResponse(data: any, alternatives: boolean): any | null {
  // Проверяем наличие ошибок
  if (data.message || !data.paths || data.paths.length === 0) {
    return null
  }

  const routes = data.paths.map((path: any) => {
    let coordinates: [number, number][] = []
    
    // GraphHopper может возвращать координаты в разных форматах
    if (path.points && path.points.coordinates) {
      // Формат: [[lat, lon], [lat, lon], ...]
      coordinates = path.points.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) // [lon, lat]
    } else if (path.coordinates) {
      // Альтернативный формат
      coordinates = path.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) // [lon, lat]
    } else {
      return null
    }
    
    return {
      distance: path.distance || 0, // в метрах
      duration: (path.time || 0) / 1000, // в секундах (GraphHopper возвращает в миллисекундах)
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    }
  }).filter((route: any) => route !== null)

  if (routes.length === 0) {
    return null
  }

  return {
    code: 'Ok',
    routes: alternatives ? routes : [routes[0]]
  }
}

// Парсер ответа OSRM
function parseOSRMResponse(data: any, alternatives: boolean): any | null {
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    return null
  }

  return data
}

// Генерирует fallback маршрут с промежуточными точками для следования основным дорогам
function generateFallbackRoute(from: string, to: string) {
  const [fromLat, fromLng] = from.split(',').map(Number)
  const [toLat, toLng] = to.split(',').map(Number)
  
  // Вычисляем расстояние по формуле гаверсинуса
  const R = 6371000 // радиус Земли в метрах
  const dLat = (toLat - fromLat) * Math.PI / 180
  const dLng = (toLng - fromLng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const straightDistance = R * c
  const distance = straightDistance * 1.5 // умножаем на 1.5 для учета извилистости дорог
  
  // Оценка времени (средняя скорость 50 км/ч)
  const duration = (distance / 1000 / 50) * 3600 // в секундах
  
  // Создаем маршрут с промежуточными точками для более реалистичного пути
  const numPoints = Math.max(20, Math.floor(distance / 50)) // больше точек для плавности
  const coordinates: [number, number][] = []
  
  // Добавляем промежуточные точки с небольшим смещением для имитации следования дорогам
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    
    // Базовые координаты
    let lat = fromLat + (toLat - fromLat) * t
    let lng = fromLng + (toLng - fromLng) * t
    
    // Добавляем небольшое смещение для имитации следования дорогам (синусоида)
    if (i > 0 && i < numPoints) {
      const offset = Math.sin(t * Math.PI * 2) * 0.001 // небольшое смещение
      lat += offset * Math.cos(Math.atan2(toLat - fromLat, toLng - fromLng))
      lng += offset * Math.sin(Math.atan2(toLat - fromLat, toLng - fromLng))
    }
    
    coordinates.push([lng, lat]) // [lon, lat] для GeoJSON
  }
  
  return {
    code: 'Ok',
    routes: [{
      distance: Math.round(distance),
      duration: Math.round(duration),
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    }]
  }
}

