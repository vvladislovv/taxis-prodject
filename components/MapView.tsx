'use client'

import { useRideStore } from '@/store/rideStore'
import { AnimatePresence, motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'

// Динамический импорт для избежания проблем с SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

const DEFAULT_FROM_COORDS: [number, number] = [55.7558, 37.6173] // Красная площадь
const DEFAULT_TO_COORDS: [number, number] = [55.7520, 37.6156] // Тверская улица (примерно 500м от Красной площади)

// Компонент для обновления карты при изменении маршрута
function MapUpdater({ fromCoords, toCoords, driverLocation, mapRef }: { fromCoords: [number, number] | null, toCoords: [number, number] | null, driverLocation?: [number, number], mapRef: React.MutableRefObject<any> }) {
  const { useMap } = require('react-leaflet')
  const { orderStatus } = useRideStore()
  const L = require('leaflet')
  const map = useMap()
  const lastBoundsRef = useRef<string | null>(null)
  const boundsUpdateTimer = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (!L) return
    // Сохраняем ссылку на карту для внешнего использования
    mapRef.current = map
    
    const points: [number, number][] = []
    
    if (driverLocation) {
      points.push(driverLocation)
    }
    if (fromCoords) {
      points.push(fromCoords)
    }
    if (toCoords) {
      points.push(toCoords)
    }
    
    if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      const boundsKey = `${bounds.getNorth()}-${bounds.getSouth()}-${bounds.getEast()}-${bounds.getWest()}`
      
      // Обновляем границы только если они существенно изменились или это не поездка
      // Во время поездки не обновляем границы, чтобы карта не дергалась
      if (orderStatus !== 'riding' && orderStatus !== 'coming') {
        if (lastBoundsRef.current !== boundsKey) {
          // Очищаем предыдущий таймер
          if (boundsUpdateTimer.current) {
            clearTimeout(boundsUpdateTimer.current)
          }
          
          // Debounce обновление границ для плавности
          boundsUpdateTimer.current = setTimeout(() => {
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 })
            lastBoundsRef.current = boundsKey
          }, 300)
        }
      } else {
        // Во время поездки только слегка подстраиваем карту, если водитель уходит за границы
        const currentBounds = map.getBounds()
        if (driverLocation && !currentBounds.contains(L.latLng(driverLocation[0], driverLocation[1]))) {
          // Плавно подстраиваем карту, чтобы водитель был виден
          if (boundsUpdateTimer.current) {
            clearTimeout(boundsUpdateTimer.current)
          }
          boundsUpdateTimer.current = setTimeout(() => {
            map.panTo(L.latLng(driverLocation[0], driverLocation[1]), { animate: true, duration: 0.3 })
          }, 500)
        }
      }
    } else if (points.length === 1) {
      if (lastBoundsRef.current !== `single-${points[0][0]}-${points[0][1]}`) {
        map.setView(points[0], 13, { animate: true, duration: 0.5 })
        lastBoundsRef.current = `single-${points[0][0]}-${points[0][1]}`
      }
    }
    
    return () => {
      if (boundsUpdateTimer.current) {
        clearTimeout(boundsUpdateTimer.current)
      }
    }
  }, [map, fromCoords, toCoords, driverLocation, mapRef, orderStatus, L])
  
  return null
}

// Вспомогательная функция для отрисовки маршрутов
function renderRoutes(
  routes: any[],
  selectedIndex: number,
  map: any,
  L: any,
  routeRef: React.MutableRefObject<any[]>,
  calculatePrice: (distance?: number, duration?: number) => void,
  setRouteCoordinates?: (coordinates: [number, number][] | null) => void
) {
  // Очищаем предыдущие маршруты
  routeRef.current.forEach((layer) => {
    if (layer) {
      map.removeLayer(layer)
    }
  })
  routeRef.current = []
  
  routes.forEach((route: any, index: number) => {
    const geometry = route.geometry
    
    if (geometry && geometry.coordinates && Array.isArray(geometry.coordinates)) {
      const coordinates: [number, number][] = geometry.coordinates.map((coord: [number, number]) => {
        if (Array.isArray(coord) && coord.length >= 2) {
          return [coord[1], coord[0]] // [lat, lon]
        }
        return null
      }).filter((coord: [number, number] | null): coord is [number, number] => coord !== null)
      
      if (coordinates.length > 0) {
        const isSelected = index === selectedIndex
        const polyline = L.polyline(coordinates, {
          color: isSelected ? '#FCD34D' : '#D1D5DB',
          weight: isSelected ? 8 : 4,
          opacity: isSelected ? 1.0 : 0.5,
          dashArray: isSelected ? undefined : '10, 10',
          interactive: false, // Отключаем интерактивность для лучшей производительности
        })
        
        polyline.addTo(map)
        routeRef.current.push(polyline)
        
        // Используем выбранный маршрут для расчета цены и сохраняем координаты
        if (isSelected) {
          const distanceKm = route.distance / 1000 // в км
          const durationMin = route.duration / 60 // в минутах
          
          // Сохраняем координаты маршрута для движения машины
          if (setRouteCoordinates) {
            setRouteCoordinates(coordinates)
          }
          
          // Симуляция учета пробок
          const hour = new Date().getHours()
          let trafficMultiplier = 1.0
          if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
            trafficMultiplier = 1.4
          } else if (hour >= 10 && hour <= 17) {
            trafficMultiplier = 1.2
          }
          
          const durationWithTraffic = durationMin * trafficMultiplier
          const distance = Math.round(distanceKm * 10) / 10
          
          calculatePrice(distance, durationWithTraffic)
        }
      }
    }
  })
}

// Компонент для отображения маршрута
function RouteDisplay({ fromCoords, toCoords }: { fromCoords: [number, number] | null, toCoords: [number, number] | null }) {
  const { useMap } = require('react-leaflet')
  const L = require('leaflet')
  const map = useMap()
  const { calculatePrice, setRouteCoordinates, orderStatus } = useRideStore()
  const routeRef = useRef<any>(null)
  const routeLockedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!L || !map) return
    
    // Если поездка началась, фиксируем маршрут
    if (orderStatus === 'riding' || orderStatus === 'coming' || orderStatus === 'arrived') {
      routeLockedRef.current = true
      return
    } else {
      routeLockedRef.current = false
    }
    
    // Очищаем предыдущий маршрут
    if (routeRef.current) {
      if (map.hasLayer(routeRef.current)) {
        map.removeLayer(routeRef.current)
      }
      routeRef.current = null
    }

    // Рисуем маршрут если есть координаты
    if (fromCoords && toCoords && !routeLockedRef.current) {
      // Проверяем валидность координат
      if (!isNaN(fromCoords[0]) && !isNaN(fromCoords[1]) &&
          !isNaN(toCoords[0]) && !isNaN(toCoords[1]) &&
          isFinite(fromCoords[0]) && isFinite(fromCoords[1]) &&
          isFinite(toCoords[0]) && isFinite(toCoords[1])) {
        
        // Рисуем маршрут
        drawFallbackRoute(fromCoords, toCoords, map, L, routeRef, calculatePrice, setRouteCoordinates)
      }
    }

    return () => {
      if (routeRef.current && !routeLockedRef.current) {
        if (map.hasLayer(routeRef.current)) {
          map.removeLayer(routeRef.current)
        }
        routeRef.current = null
      }
    }
  }, [map, fromCoords, toCoords, calculatePrice, setRouteCoordinates, orderStatus, L])

  return null
}

// Функция для отрисовки маршрута между двумя точками
function drawFallbackRoute(
  fromCoords: [number, number],
  toCoords: [number, number],
  map: any,
  L: any,
  routeRef: React.MutableRefObject<any>,
  calculatePrice: (distance?: number, duration?: number) => void,
  setRouteCoordinates?: (coordinates: [number, number][] | null) => void
) {
  // Проверяем валидность координат
  if (!fromCoords || !toCoords ||
      isNaN(fromCoords[0]) || isNaN(fromCoords[1]) ||
      isNaN(toCoords[0]) || isNaN(toCoords[1]) ||
      !isFinite(fromCoords[0]) || !isFinite(fromCoords[1]) ||
      !isFinite(toCoords[0]) || !isFinite(toCoords[1])) {
    return
  }
  
  // Создаем маршрут - прямая линия между точками
  const coordinates: [number, number][] = [fromCoords, toCoords]
  
  // Создаем полилинию
  const polyline = L.polyline(coordinates, {
    color: '#FCD34D',
    weight: 8,
    opacity: 1.0,
    interactive: false,
  })
  
  // Добавляем на карту
  polyline.addTo(map)
  routeRef.current = polyline
  
  // Сохраняем координаты маршрута для движения машины
  if (setRouteCoordinates) {
    setRouteCoordinates(coordinates)
  }
  
  // Вычисляем расстояние и время
  const R = 6371 // Радиус Земли в км
  const lat1 = fromCoords[0] * Math.PI / 180
  const lat2 = toCoords[0] * Math.PI / 180
  const dLatRad = (toCoords[0] - fromCoords[0]) * Math.PI / 180
  const dLngRad = (toCoords[1] - fromCoords[1]) * Math.PI / 180
  
  const a = Math.sin(dLatRad/2) * Math.sin(dLatRad/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLngRad/2) * Math.sin(dLngRad/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  let distance = Math.round(R * c * 10) / 10
  
  if (distance < 0.1 || isNaN(distance) || !isFinite(distance)) {
    distance = 0.5
  }
  
  const duration = Math.round((distance / 40) * 60) // Средняя скорость 40 км/ч
  calculatePrice(distance, duration)
}

// Компонент для обработки кликов по карте (улучшен для мобильных)
function MapClickHandler({ onMapClick, clickType }: { onMapClick: (lat: number, lng: number, type: 'from' | 'to' | 'auto') => void, clickType: 'from' | 'to' | 'auto' }) {
  const { useMapEvents } = require('react-leaflet')
  let lastClickTime = 0
  
  useMapEvents({
    click: (e: any) => {
      // Предотвращаем всплытие события
      if (e.originalEvent) {
        e.originalEvent.stopPropagation()
        e.originalEvent.preventDefault()
      }
      
      if (e.latlng) {
        // Предотвращаем двойные клики (debounce)
        const now = Date.now()
        if (now - lastClickTime < 300) {
          return
        }
        lastClickTime = now
        
        onMapClick(e.latlng.lat, e.latlng.lng, clickType)
      }
    },
  })
  
  return null
}

const MapView = () => {
  // Инициализируем mounted как false для одинакового рендеринга на сервере и клиенте
  const [mounted, setMounted] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; type: 'from' | 'to' } | null>(null)
  const mapRef = useRef<any>(null)
  const { fromAddress, toAddress, fromCoords, toCoords, setFromCoords, setToCoords, setFromAddress, setToAddress, orderStatus, driver, mapClickMode, setMapClickMode, setCenterMapOnCoords, routeAlternatives, selectedRouteIndex, setSelectedRouteIndex } = useRideStore()
  
  // Функция для центрирования карты на координатах
  const centerMapOnCoords = useCallback((coords: [number, number]) => {
    if (mapRef.current && typeof window !== 'undefined') {
      const L = require('leaflet')
      if (L && mapRef.current.setView) {
        mapRef.current.setView(coords, 15, { animate: true, duration: 0.5 })
      }
    }
  }, [])
  
  // Регистрируем функцию центрирования в store
  useEffect(() => {
    setCenterMapOnCoords(centerMapOnCoords)
    return () => setCenterMapOnCoords(null)
  }, [centerMapOnCoords, setCenterMapOnCoords])

  // Устанавливаем mounted только на клиенте
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      require('leaflet/dist/leaflet.css')
    }
  }, [])

  // Инициализация тестовых данных при первом запуске
  useEffect(() => {
    if (!mounted) return
    
    // Если адреса не установлены, устанавливаем тестовые для обеих точек
    if (!fromAddress && !fromCoords) {
      setFromCoords(DEFAULT_FROM_COORDS)
      setFromAddress('Москва, Красная площадь, 1')
    }
    
    if (!toAddress && !toCoords) {
      setToCoords(DEFAULT_TO_COORDS)
      setToAddress('Москва, Тверская улица, 10')
    }
    
    // Центрируем карту на тестовых координатах при первом запуске
    if (mapRef.current) {
          const L = require('leaflet')
          if (L && mapRef.current.setView) {
            setTimeout(() => {
              if (mapRef.current) {
            // Центрируем карту так, чтобы были видны обе точки
            const centerLat = (DEFAULT_FROM_COORDS[0] + DEFAULT_TO_COORDS[0]) / 2
            const centerLng = (DEFAULT_FROM_COORDS[1] + DEFAULT_TO_COORDS[1]) / 2
            mapRef.current.setView([centerLat, centerLng], 14, { animate: false })
              }
            }, 100)
          }
        }
  }, [
    mounted,
    fromAddress,
    fromCoords,
    toAddress,
    toCoords,
    setFromCoords,
    setToCoords,
    setFromAddress,
    setToAddress,
  ])

  useEffect(() => {
    // Для демо проекта отключаем API геокодирования - используем только тестовые данные
    const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
      if (!address || address.trim() === '') return null
      
      // Если адрес содержит координаты, парсим их
      const coordMatch = address.match(/(\d+\.\d+),\s*(\d+\.\d+)/)
      if (coordMatch) {
        return [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]
      }
      
      // Для демо проекта отключаем API - используем тестовые координаты
      // API запросы закомментированы:
      /*
      try {
        const response = await fetch(`/api/geocode?query=${encodeURIComponent(address)}`)
        if (!response.ok) {
          throw new Error('Geocoding failed')
        }
        
        const data = await response.json()
        
        if (data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject) {
          const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
          const point = geoObject.Point?.pos
          
          if (point) {
            const [lon, lat] = point.split(' ').map(Number)
            if (!isNaN(lat) && !isNaN(lon)) {
              return [lat, lon]
            }
          }
        }
      } catch (error) {
        console.error('Ошибка геокодирования:', error)
      }
      */
      
      // Дефолтные координаты для неизвестных адресов (тестовые данные)
      return [55.7558, 37.6173] // Москва, центр
    }

    // Debounce для геокодирования
    const geocodeTimer = setTimeout(async () => {
      if (fromAddress && fromAddress.trim() !== '') {
        // Если адрес - это координаты, получаем адрес по координатам
        const coordMatch = fromAddress.match(/(\d+\.\d+),\s*(\d+\.\d+)/)
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1])
          const lng = parseFloat(coordMatch[2])
          setFromCoords([lat, lng])
          
          // Для демо проекта отключаем API - используем тестовые данные
          // API запросы закомментированы:
          /*
          try {
            const response = await fetch(`/api/geocode?query=${lng},${lat}`)
            const data = await response.json()
            
            if (data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject) {
              const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
              const geocoderMeta = geoObject.metaDataProperty?.GeocoderMetaData
              
              if (geocoderMeta?.Address) {
                const addr = geocoderMeta.Address
                let address = ''
                if (addr.Street && addr.House) {
                  address = `${addr.Street}, д. ${addr.House}`
                } else if (addr.Street) {
                  address = addr.Street
                } else if (geocoderMeta?.text) {
                  address = geocoderMeta.text.split(',')[0]
                }
                
                if (address) {
                  setFromAddress(address)
                }
              }
            }
          } catch (error) {
            console.error('Ошибка получения адреса:', error)
          }
          */
        } else {
          const coords = await geocodeAddress(fromAddress)
          if (coords) {
            setFromCoords(coords)
            // Центрируем карту на новой координате
            if (centerMapOnCoords) {
              setTimeout(() => centerMapOnCoords(coords), 100)
            }
          }
        }
      } else {
        setFromCoords(null)
      }

      if (toAddress && toAddress.trim() !== '') {
        // Если адрес - это координаты, получаем адрес по координатам
        const coordMatch = toAddress.match(/(\d+\.\d+),\s*(\d+\.\d+)/)
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1])
          const lng = parseFloat(coordMatch[2])
          setToCoords([lat, lng])
          
          // Для демо проекта отключаем API - используем тестовые данные
          // API запросы закомментированы:
          /*
          try {
            const response = await fetch(`/api/geocode?query=${lng},${lat}`)
            const data = await response.json()
            
            if (data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject) {
              const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
              const geocoderMeta = geoObject.metaDataProperty?.GeocoderMetaData
              
              if (geocoderMeta?.Address) {
                const addr = geocoderMeta.Address
                let address = ''
                if (addr.Street && addr.House) {
                  address = `${addr.Street}, д. ${addr.House}`
                } else if (addr.Street) {
                  address = addr.Street
                } else if (geocoderMeta?.text) {
                  address = geocoderMeta.text.split(',')[0]
                }
                
                if (address) {
                  setToAddress(address)
                }
              }
            }
          } catch (error) {
            console.error('Ошибка получения адреса:', error)
          }
          */
        } else {
          const coords = await geocodeAddress(toAddress)
          if (coords) {
            setToCoords(coords)
            // Центрируем карту на новой координате
            if (centerMapOnCoords) {
              setTimeout(() => centerMapOnCoords(coords), 100)
            }
          }
        }
      } else {
        setToCoords(null)
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(geocodeTimer)
  }, [fromAddress, toAddress, setFromCoords, setToCoords, setFromAddress, setToAddress, centerMapOnCoords])

  const handleMapClick = async (lat: number, lng: number, type: 'from' | 'to' | 'auto') => {
    const coords: [number, number] = [lat, lng]
    
    // Автоматически определяем, какую точку устанавливать
    let actualType: 'from' | 'to' = type as 'from' | 'to'
    if (type === 'auto') {
      // Если "откуда" не установлено, устанавливаем "откуда", иначе "куда"
      actualType = !fromCoords ? 'from' : 'to'
    }
    
    // Сначала устанавливаем координаты для мгновенной обратной связи
    if (actualType === 'from') {
      setFromCoords(coords)
    } else {
      setToCoords(coords)
    }
    
    // Показываем временный адрес
    const tempAddress = `Определение адреса...`
    if (actualType === 'from') {
      setFromAddress(tempAddress)
    } else {
      setToAddress(tempAddress)
    }
    
    // Для демо проекта отключаем API - используем тестовые данные
    // API запросы закомментированы:
    let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    
    /*
    try {
      // Используем наш API роут для геокодирования
      const response = await fetch(`/api/geocode?query=${lng},${lat}`)
      const data = await response.json()
      
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      
      if (data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject) {
        const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
        const geocoderMeta = geoObject.metaDataProperty?.GeocoderMetaData
        
        // Формируем точный адрес: улица + дом
        if (geocoderMeta?.Address) {
          const addr = geocoderMeta.Address
          const parts: string[] = []
          
          // Сначала улица
          if (addr.Street) {
            const streetName = addr.Street
            // Затем дом
            if (addr.House) {
              parts.push(`${streetName}, д. ${addr.House}`)
            } else {
              parts.push(streetName)
            }
          } else if (addr.House) {
            parts.push(`д. ${addr.House}`)
          }
          
          // Если есть район или город, добавляем для контекста
          if (parts.length > 0 && addr.Locality && !parts[0].includes(addr.Locality)) {
            // Обычно не добавляем город, если это Москва
            if (addr.Locality !== 'Москва') {
              parts.push(addr.Locality)
            }
          }
          
          address = parts.length > 0 ? parts.join(', ') : (geocoderMeta?.text || address)
        } else if (geocoderMeta?.text) {
          // Используем полный текст, но берем только улицу и дом
          const fullText = geocoderMeta.text
          const parts = fullText.split(',')
          // Берем первые 2 части (обычно это улица и дом)
          address = parts.slice(0, 2).join(', ').trim() || fullText
        } else if (geoObject.name) {
          address = geoObject.name
        }
      }
      
      // Обновляем адрес с анимацией
      if (actualType === 'from') {
        setFromAddress(address)
      } else {
        setToAddress(address)
      }
      
      // Показываем уведомление о выборе
      setSelectedAddress({ address, type: actualType })
      setTimeout(() => {
        setSelectedAddress(null)
      }, 3000)
      
    } catch (error) {
      console.error('Ошибка получения адреса:', error)
      const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      if (actualType === 'from') {
        setFromAddress(address)
      } else {
        setToAddress(address)
      }
    }
    */
    
    // Для демо проекта используем только координаты без API запросов
    // Обновляем адрес с координатами
    if (actualType === 'from') {
      setFromAddress(address)
    } else {
      setToAddress(address)
    }
    
    // Показываем уведомление о выборе
    setSelectedAddress({ address, type: actualType })
    setTimeout(() => {
      setSelectedAddress(null)
    }, 3000)
    
    // Сбрасываем режим клика после выбора точки
    setTimeout(() => {
      setMapClickMode(null)
    }, 500)
  }

  // Компонент уже не рендерится на сервере благодаря dynamic import с ssr: false
  if (!mounted) {
    return (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    )
  }
  
  // Используем тестовые координаты по умолчанию
  const mapCenter = fromCoords || DEFAULT_FROM_COORDS

  let L: any = null
  if (typeof window !== 'undefined' && mounted) {
    L = require('leaflet')
    
    if (L.Icon.Default.prototype._getIconUrl) {
      delete L.Icon.Default.prototype._getIconUrl
    }
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }

  return (
    <div className="absolute inset-0 z-0">
      {/* Подсказка о выборе на карте */}
      <AnimatePresence mode="wait">
        {mapClickMode && mapClickMode !== 'auto' && (
          <motion.div
            key={mapClickMode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 glass px-6 py-3 rounded-xl text-sm text-gray-700 shadow-xl"
            suppressHydrationWarning
          >
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{mapClickMode === 'from' ? '📍' : '🎯'}</span>
                <span className="font-semibold text-gray-800">
                  Кликните на карте для выбора {mapClickMode === 'from' ? 'точки отправления' : 'точки назначения'}
                </span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMapClickMode(null)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {mounted && (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          doubleClickZoom={false}
          closePopupOnClick={false}
          key="map-container"
        >
        <TileLayer
          attribution=''
          url="https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}"
          tileSize={256}
          zoomOffset={0}
          maxZoom={19}
        />
        
        {/* Маркер точки отправления - всегда показываем, используем тестовые если нет реальных */}
        {L && (fromCoords || DEFAULT_FROM_COORDS) && (
          <Marker 
            key={`from-${fromCoords?.[0] || DEFAULT_FROM_COORDS[0]}-${fromCoords?.[1] || DEFAULT_FROM_COORDS[1]}`}
            position={fromCoords || DEFAULT_FROM_COORDS}
            zIndexOffset={1000}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="3"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>Откуда: {fromAddress || 'Москва, Красная площадь, 1'}</Popup>
          </Marker>
        )}

        {/* Маркер точки назначения - всегда показываем, используем тестовые если нет реальных */}
        {L && (toCoords || DEFAULT_TO_COORDS) && (
          <Marker 
            key={`to-${toCoords?.[0] || DEFAULT_TO_COORDS[0]}-${toCoords?.[1] || DEFAULT_TO_COORDS[1]}`}
            position={toCoords || DEFAULT_TO_COORDS}
            zIndexOffset={1000}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="white" stroke-width="3"/>
                  <circle cx="16" cy="16" r="6" fill="white"/>
                </svg>
              `),
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>Куда: {toAddress || 'Москва, Тверская улица, 10'}</Popup>
          </Marker>
        )}

        {/* Маркер машины водителя */}
        {driver?.location && L && (orderStatus === 'coming' || orderStatus === 'arrived' || orderStatus === 'riding') && (
          <Marker 
            position={driver.location}
            zIndexOffset={2000}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" fill="#3b82f6" stroke="white" stroke-width="4"/>
                  <path d="M14 24 L18 18 L30 18 L34 24 L34 30 L30 36 L18 36 L14 30 Z" fill="white"/>
                  <circle cx="20" cy="26" r="2.5" fill="#3b82f6"/>
                  <circle cx="28" cy="26" r="2.5" fill="#3b82f6"/>
                </svg>
              `),
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            })}
          >
            <Popup>
              <div className="text-center">
                <div className="font-bold">{driver.name}</div>
                <div className="text-sm">{driver.car}</div>
                <div className="text-xs text-gray-500">{driver.plate}</div>
              </div>
            </Popup>
          </Marker>
        )}

        <MapUpdater 
          fromCoords={fromCoords || DEFAULT_FROM_COORDS} 
          toCoords={toCoords || DEFAULT_TO_COORDS} 
          driverLocation={driver?.location} 
          mapRef={mapRef} 
        />
        
        {/* Разрешаем клики на карте для выбора точек (кроме активного заказа) */}
        {!orderStatus && mapClickMode && (
          <MapClickHandler 
            onMapClick={handleMapClick} 
            clickType={mapClickMode} 
          />
        )}
        
        {/* Показываем маршрут всегда - используем тестовые координаты если нет реальных */}
        <RouteDisplay 
          fromCoords={fromCoords || DEFAULT_FROM_COORDS} 
          toCoords={toCoords || DEFAULT_TO_COORDS}
        />
      </MapContainer>
      )}
      

      {/* Уведомление о выборе адреса */}
      <AnimatePresence mode="wait">
        {selectedAddress && (
          <motion.div
            key="address-notification"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass px-6 py-3 rounded-xl shadow-2xl"
            suppressHydrationWarning
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedAddress.type === 'from' ? '📍' : '🎯'}</span>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  {selectedAddress.type === 'from' ? 'Откуда' : 'Куда'}
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {selectedAddress.address.split(',')[0]}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MapView
