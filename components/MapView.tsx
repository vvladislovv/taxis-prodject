'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'

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

// Компонент для обновления карты при изменении маршрута
function MapUpdater({ fromCoords, toCoords, driverLocation, mapRef }: { fromCoords: [number, number] | null, toCoords: [number, number] | null, driverLocation?: [number, number], mapRef: React.MutableRefObject<any> }) {
  const { useMap } = require('react-leaflet')
  const L = require('leaflet')
  const map = useMap()
  
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
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (points.length === 1) {
      map.setView(points[0], 13)
    }
  }, [map, fromCoords, toCoords, driverLocation, mapRef])
  
  return null
}

// Компонент для отображения маршрута
function RouteDisplay({ fromCoords, toCoords }: { fromCoords: [number, number] | null, toCoords: [number, number] | null }) {
  const { useMap } = require('react-leaflet')
  const L = require('leaflet')
  const map = useMap()
  const { calculatePrice } = useRideStore()
  const routeRef = useRef<any>(null)

  useEffect(() => {
    if (!L) return
    
    if (routeRef.current) {
      map.removeLayer(routeRef.current)
      routeRef.current = null
    }

    if (fromCoords && toCoords) {
      // Используем тестовые данные для демо
      // Генерируем промежуточные точки для более реалистичного маршрута
      const latDiff = toCoords[0] - fromCoords[0]
      const lngDiff = toCoords[1] - fromCoords[1]
      
      const coordinates: [number, number][] = [fromCoords]
      
      // Добавляем промежуточные точки для плавного маршрута
      for (let i = 1; i < 5; i++) {
        const ratio = i / 5
        coordinates.push([
          fromCoords[0] + latDiff * ratio + (Math.random() - 0.5) * 0.01,
          fromCoords[1] + lngDiff * ratio + (Math.random() - 0.5) * 0.01,
        ])
      }
      coordinates.push(toCoords)
      
      const polyline = L.polyline(coordinates, {
        color: '#FFD700',
        weight: 5,
        opacity: 0.8,
      })
      
      polyline.addTo(map)
      routeRef.current = polyline
      
      // Вычисляем примерное расстояние (формула гаверсинуса)
      const R = 6371 // радиус Земли в км
      const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180
      const dLng = (toCoords[1] - fromCoords[1]) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(fromCoords[0] * Math.PI / 180) * Math.cos(toCoords[0] * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const baseDistance = R * c
      
      // Добавляем коэффициент для учета реальных дорог (обычно 1.3-1.5)
      const roadMultiplier = 1.4
      const distance = Math.round(baseDistance * roadMultiplier * 10) / 10
      
      // Симуляция учета пробок
      const hour = new Date().getHours()
      let trafficMultiplier = 1.0
      if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
        trafficMultiplier = 1.4
      } else if (hour >= 10 && hour <= 17) {
        trafficMultiplier = 1.2
      }
      
      // Средняя скорость в городе ~40 км/ч, с учетом пробок
      const averageSpeed = 40 / trafficMultiplier
      const duration = Math.round((distance / averageSpeed) * 60) // в минутах
      
      calculatePrice(distance, duration)
    }

    return () => {
      if (routeRef.current) {
        map.removeLayer(routeRef.current)
        routeRef.current = null
      }
    }
  }, [map, fromCoords, toCoords, calculatePrice])

  return null
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; type: 'from' | 'to' } | null>(null)
  const mapRef = useRef<any>(null)
  const { fromAddress, toAddress, fromCoords, toCoords, setFromCoords, setToCoords, setFromAddress, setToAddress, orderStatus, driver, mapClickMode, setMapClickMode, setCenterMapOnCoords } = useRideStore()
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
        },
        () => {
          setUserLocation([55.7558, 37.6173])
        }
      )
    } else {
      setUserLocation([55.7558, 37.6173])
    }
  }, [])

  useEffect(() => {
    const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
      if (!address) return null
      
      // Используем тестовые данные для демо
      // Маппинг адресов на координаты для демо
      const addressMap: { [key: string]: [number, number] } = {
        'красная площадь': [55.7539, 37.6208],
        'тверская': [55.7558, 37.6173],
        'арбат': [55.7520, 37.5914],
        'ленинский проспект': [55.7000, 37.5500],
        'кутузовский проспект': [55.7400, 37.5300],
        'садовое кольцо': [55.7500, 37.6000],
        'вднх': [55.8300, 37.6300],
        'парк горького': [55.7320, 37.6010],
        'сокольники': [55.7900, 37.6800],
        'измайловский парк': [55.7900, 37.7500],
      }
      
      const addressLower = address.toLowerCase()
      for (const [key, coords] of Object.entries(addressMap)) {
        if (addressLower.includes(key)) {
          return coords
        }
      }
      
      // Если адрес содержит координаты, парсим их
      const coordMatch = address.match(/(\d+\.\d+),\s*(\d+\.\d+)/)
      if (coordMatch) {
        return [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]
      }
      
      // Дефолтные координаты для неизвестных адресов
      return [55.7558, 37.6173] // Москва, центр
    }

    const updateCoordinates = async () => {
      if (fromAddress) {
        const coords = await geocodeAddress(fromAddress)
        setFromCoords(coords)
      } else {
        setFromCoords(null)
      }

      if (toAddress) {
        const coords = await geocodeAddress(toAddress)
        setToCoords(coords)
      } else {
        setToCoords(null)
      }
    }

    updateCoordinates()
  }, [fromAddress, toAddress, setFromCoords, setToCoords])

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
    
    // Используем тестовые данные для демо
    try {
      // Имитируем задержку API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Генерируем тестовый адрес на основе координат
      let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      
      // Маппинг координат на адреса для демо
      const coordToAddress: { [key: string]: string } = {
        '55.7539,37.6208': 'Красная площадь, 1',
        '55.7558,37.6173': 'Тверская улица, 10',
        '55.7520,37.5914': 'Арбат, 25',
        '55.7000,37.5500': 'Ленинский проспект, 50',
        '55.7400,37.5300': 'Кутузовский проспект, 15',
        '55.7500,37.6000': 'Садовое кольцо, 100',
        '55.8300,37.6300': 'ВДНХ, проспект Мира, 119',
        '55.7320,37.6010': 'Парк Горького, Крымский Вал, 9',
        '55.7900,37.6800': 'Сокольники, Сокольнический Вал, 1',
        '55.7900,37.7500': 'Измайловский парк, аллея Большого Круга',
      }
      
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
      if (coordToAddress[coordKey]) {
        address = coordToAddress[coordKey]
      } else {
        // Генерируем примерный адрес на основе координат
        const streetNames = ['Ленина', 'Мира', 'Советская', 'Центральная', 'Победы']
        const streetIndex = Math.floor((lat * 100) % streetNames.length)
        const houseNumber = Math.floor((lng * 100) % 100) + 1
        address = `ул. ${streetNames[streetIndex]}, ${houseNumber}`
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
    
    // Сбрасываем режим клика после выбора точки
    setTimeout(() => {
      setMapClickMode(null)
    }, 500)
  }

  // Компонент уже не рендерится на сервере благодаря dynamic import с ssr: false
  // Но все равно проверяем mounted и userLocation для безопасности
  if (!mounted || !userLocation) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    )
  }

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
      <AnimatePresence>
        {mapClickMode && mapClickMode !== 'auto' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 glass px-6 py-3 rounded-xl text-sm text-gray-700 shadow-xl"
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
      
      {mounted && userLocation && (
        <MapContainer
          center={userLocation}
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
        
        <Marker position={userLocation}>
          <Popup>Ваше местоположение</Popup>
        </Marker>

        {fromCoords && L && (
          <Marker 
            position={fromCoords}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25">
                  <circle cx="12.5" cy="12.5" r="10" fill="#22c55e" stroke="white" stroke-width="2"/>
                </svg>
              `),
              iconSize: [25, 25],
              iconAnchor: [12.5, 12.5],
            })}
          >
            <Popup>Откуда: {fromAddress}</Popup>
          </Marker>
        )}

        {toCoords && L && (
          <Marker 
            position={toCoords}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25">
                  <circle cx="12.5" cy="12.5" r="10" fill="#ef4444" stroke="white" stroke-width="2"/>
                </svg>
              `),
              iconSize: [25, 25],
              iconAnchor: [12.5, 12.5],
            })}
          >
            <Popup>Куда: {toAddress}</Popup>
          </Marker>
        )}

        {/* Маркер машины водителя */}
        {driver?.location && L && (orderStatus === 'coming' || orderStatus === 'arrived' || orderStatus === 'riding') && (
          <Marker 
            position={driver.location}
            icon={L.icon({
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
                  <text x="20" y="28" font-size="24" text-anchor="middle">🚗</text>
                </svg>
              `),
              iconSize: [40, 40],
              iconAnchor: [20, 20],
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

        <MapUpdater fromCoords={fromCoords} toCoords={toCoords} driverLocation={driver?.location} mapRef={mapRef} />
        
        {/* Разрешаем клики на карте для выбора точек (кроме активного заказа) */}
        {!orderStatus && mapClickMode && (
          <MapClickHandler 
            onMapClick={handleMapClick} 
            clickType={mapClickMode} 
          />
        )}
        
        {/* Показываем маршрут если есть обе точки или если идет поездка */}
        {((fromCoords && toCoords) || (orderStatus === 'riding' && driver?.location && toCoords)) && (
          <RouteDisplay 
            fromCoords={orderStatus === 'riding' && driver?.location ? driver.location : fromCoords} 
            toCoords={toCoords} 
          />
        )}
      </MapContainer>
      )}
      

      {/* Уведомление о выборе адреса */}
      <AnimatePresence>
        {selectedAddress && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 glass px-6 py-3 rounded-xl shadow-2xl"
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
