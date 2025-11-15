'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'
import { useEffect } from 'react'

const OrderStatusPanel = () => {
  const { orderStatus, driver, setOrderStatus, setDriver, reset, fromCoords, toCoords, duration, routeCoordinates } = useRideStore()

  // Симуляция движения водителя к точке отправления с плавной анимацией
  useEffect(() => {
    if (orderStatus === 'coming' && driver && fromCoords) {
      // Инициализируем местоположение водителя, если его нет
      // Размещаем водителя на реалистичном расстоянии от точки отправления
      // в направлении, противоположном маршруту (как будто он едет к нам)
      let startLocation: [number, number]
        if (driver.location) {
        startLocation = driver.location
      } else {
        // Вычисляем направление от точки назначения к точке отправления
        const directionLat = fromCoords[0] - (toCoords?.[0] || fromCoords[0])
        const directionLng = fromCoords[1] - (toCoords?.[1] || fromCoords[1])
        const distance = Math.sqrt(directionLat * directionLat + directionLng * directionLng)
        
        // Нормализуем направление
        const normalizedLat = distance > 0 ? directionLat / distance : 0
        const normalizedLng = distance > 0 ? directionLng / distance : 0
        
        // Размещаем водителя на расстоянии 0.02-0.03 градусов (примерно 2-3 км) от точки отправления
        // в направлении, откуда он будет ехать
        const driverDistance = 0.025 + Math.random() * 0.005 // 0.025-0.03 градусов
        startLocation = [
          fromCoords[0] - normalizedLat * driverDistance,
          fromCoords[1] - normalizedLng * driverDistance
        ]
      }
      
      if (!driver.location) {
        // Округляем ETA вверх до целых минут
        const initialEta = Math.ceil(driver.eta || 3)
        setDriver({ ...driver, location: startLocation, eta: initialEta })
      }
      
      // Симулируем плавное движение водителя от начальной точки к точке отправления
      let currentLocation: [number, number] = [...startLocation]
      let animationFrameId: number | null = null
      const startTime = Date.now()
      // Округляем ETA вверх до целых минут и ускоряем в 3 раза
      const etaMinutes = Math.ceil(driver.eta || 3)
      const acceleratedEtaDuration = (etaMinutes * 60 * 1000) / 3 // Ускоряем в 3 раза
      const waitTime = 1000 // 1 секунда ожидания перед началом
      const totalDuration = acceleratedEtaDuration + waitTime
      
      // Функция плавной интерполяции
      const easeInOutQuad = (t: number): number => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      }
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        
        // Добавляем ожидание перед началом движения
        if (elapsed < waitTime) {
          // Ожидание - водитель еще не начал движение
          animationFrameId = requestAnimationFrame(animate)
          return
        }
        
        // Рассчитываем прогресс после ожидания
        const movementElapsed = elapsed - waitTime
        const progress = Math.min(movementElapsed / acceleratedEtaDuration, 1)
        const easedProgress = easeInOutQuad(progress)
        
        // Плавная интерполяция
        const newLat = startLocation[0] + (fromCoords[0] - startLocation[0]) * easedProgress
        const newLng = startLocation[1] + (fromCoords[1] - startLocation[1]) * easedProgress
        
        // Обновляем только если координаты изменились достаточно
        const latDiff = Math.abs(newLat - currentLocation[0])
        const lngDiff = Math.abs(newLng - currentLocation[1])
        
        if (latDiff > 0.00001 || lngDiff > 0.00001) {
          currentLocation = [newLat, newLng]
          // Обновляем ETA на основе прогресса - округляем вверх до целых минут
          const newEta = Math.max(0, etaMinutes * (1 - progress))
          const roundedEta = Math.ceil(newEta) // Округляем вверх: 0.7 -> 1, 0.3 -> 1
          setDriver({ ...driver, location: currentLocation, eta: roundedEta })
        }
        
        // Если водитель достиг точки отправления
        if (progress >= 1) {
            setOrderStatus('arrived')
          setDriver({ ...driver, location: fromCoords, eta: 0 })
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
          }
          return
        }
        
        animationFrameId = requestAnimationFrame(animate)
      }
      
      animationFrameId = requestAnimationFrame(animate)
      
      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [orderStatus, driver, fromCoords, setDriver, setOrderStatus])

  // Симуляция движения во время поездки с плавной анимацией по маршруту
  useEffect(() => {
    if (orderStatus === 'riding' && driver && fromCoords && toCoords) {
      // При начале поездки водитель находится в точке отправления
      const startLocation: [number, number] = driver.location && 
        Math.abs(driver.location[0] - fromCoords[0]) < 0.01 ? 
        driver.location : fromCoords
      
      if (!driver.location || Math.abs(driver.location[0] - fromCoords[0]) > 0.01) {
        setDriver({ ...driver, location: startLocation })
      }
      
      // Используем координаты маршрута, если они есть, иначе используем прямую линию
      const routePoints: [number, number][] = routeCoordinates && routeCoordinates.length > 0 
        ? routeCoordinates 
        : [fromCoords, toCoords]
      
      // Сохраняем начальное местоположение для плавного движения
      let currentLocation: [number, number] = [...startLocation]
      let progress = 0
      let animationFrameId: number | null = null
      const startTime = Date.now()
      
      // Ускоряем поездку в 3 раза, но добавляем ожидание для реалистичности
      const acceleratedDuration = (duration * 60 * 1000) / 3 // Ускоряем в 3 раза
      const waitTime = 2000 // 2 секунды ожидания перед началом
      
      // Функция плавной интерполяции (easing)
      const easeInOutQuad = (t: number): number => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      }
      
      // Функция для получения точки на маршруте по прогрессу
      const getPointOnRoute = (progressValue: number): [number, number] => {
        if (routePoints.length === 0) return toCoords
        if (progressValue <= 0) return routePoints[0]
        if (progressValue >= 1) return routePoints[routePoints.length - 1]
        
        // Вычисляем общую длину маршрута
        let totalLength = 0
        const segmentLengths: number[] = []
        for (let i = 0; i < routePoints.length - 1; i++) {
          const lat1 = routePoints[i][0]
          const lng1 = routePoints[i][1]
          const lat2 = routePoints[i + 1][0]
          const lng2 = routePoints[i + 1][1]
          const dLat = lat2 - lat1
          const dLng = lng2 - lng1
          const segmentLength = Math.sqrt(dLat * dLat + dLng * dLng)
          segmentLengths.push(segmentLength)
          totalLength += segmentLength
        }
        
        // Находим нужный сегмент
        const targetLength = totalLength * progressValue
        let accumulatedLength = 0
        for (let i = 0; i < segmentLengths.length; i++) {
          if (accumulatedLength + segmentLengths[i] >= targetLength) {
            // Находим точку внутри этого сегмента
            const segmentProgress = (targetLength - accumulatedLength) / segmentLengths[i]
            const lat = routePoints[i][0] + (routePoints[i + 1][0] - routePoints[i][0]) * segmentProgress
            const lng = routePoints[i][1] + (routePoints[i + 1][1] - routePoints[i][1]) * segmentProgress
            return [lat, lng]
          }
          accumulatedLength += segmentLengths[i]
        }
        
        return routePoints[routePoints.length - 1]
      }
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        
        // Добавляем ожидание перед началом движения
        if (elapsed < waitTime) {
          // Ожидание - водитель на месте
          animationFrameId = requestAnimationFrame(animate)
          return
        }
        
        // Рассчитываем прогресс после ожидания
        const movementElapsed = elapsed - waitTime
        progress = Math.min(movementElapsed / acceleratedDuration, 1)
          
        // Используем плавную интерполяцию
        const easedProgress = easeInOutQuad(progress)
        
        // Получаем точку на маршруте по прогрессу
        const routePoint = getPointOnRoute(easedProgress)
        
        // Обновляем только если координаты изменились достаточно
        const latDiff = Math.abs(routePoint[0] - currentLocation[0])
        const lngDiff = Math.abs(routePoint[1] - currentLocation[1])
        
        if (latDiff > 0.00001 || lngDiff > 0.00001) {
          currentLocation = routePoint
          // Обновляем оставшееся время - округляем вверх до целых минут
          const remainingMinutes = Math.max(0, duration * (1 - progress))
          const roundedRemaining = Math.ceil(remainingMinutes) // 0.7 -> 1, 0.3 -> 1
          setDriver({ ...driver, location: currentLocation })
        }
        
        // Если поездка завершена
        if (progress >= 1) {
          // Устанавливаем точное местоположение назначения
          setDriver({ ...driver, location: toCoords })
            setOrderStatus('completed')
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
          }
          return
        }
        
        // Продолжаем анимацию
        animationFrameId = requestAnimationFrame(animate)
          }
      
      // Запускаем анимацию
      animationFrameId = requestAnimationFrame(animate)
      
      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [orderStatus, driver, fromCoords, toCoords, setDriver, setOrderStatus, duration, routeCoordinates])

  // Инициализация местоположения водителя при найденном водителе
  useEffect(() => {
    if (orderStatus === 'found' && driver && fromCoords && !driver.location) {
      // Водитель находится немного в стороне от точки отправления
      const offsetLat = fromCoords[0] + (Math.random() - 0.5) * 0.01
      const offsetLng = fromCoords[1] + (Math.random() - 0.5) * 0.01
      setDriver({ ...driver, location: [offsetLat, offsetLng] })
    }
  }, [orderStatus, driver, fromCoords, setDriver])

  // Не показываем панель статуса, если поездка завершена (показывается RatingPanel)
  if (!orderStatus || orderStatus === 'completed') return null

  const handleCancel = () => {
    setOrderStatus(null)
    // Сбрасываем зафиксированную цену при отмене
    const { setFixedPrice } = useRideStore.getState()
    setFixedPrice(null)
    reset()
  }
  
  const handleComplete = () => {
    // Переход к оценке произойдет автоматически через RatingPanel
  }

  const handleStartRide = () => {
    if (!driver || !fromCoords) return
    
    setOrderStatus('riding')
    // Водитель начинает с точки отправления
    setDriver({ ...driver, location: fromCoords })
    
    // Поездка будет симулироваться в useEffect выше
    // Длительность зависит от duration из store
  }

  return (
    <AnimatePresence>
      {orderStatus && (
        <>
          {/* Кнопка закрытия вверху - не показываем для завершенного заказа */}
          {orderStatus !== 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-30"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCancel}
              className="glass rounded-full p-3 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
          )}

          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="glass rounded-t-3xl p-6 shadow-2xl">
            <AnimatePresence mode="wait">
              {orderStatus === 'searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    Поиск водителя
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Пожалуйста, подождите...
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold"
                  >
                    Отменить заказ
                  </motion.button>
                </motion.div>
              )}

              {orderStatus === 'found' && driver && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      👤
                    </div>
                    <h3 className="text-lg font-bold mb-1">{driver.name}</h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-yellow-400">⭐</span>
                      <span className="font-semibold">{driver.rating}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{driver.car}</p>
                    <p className="text-xs text-gray-500">{driver.plate}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Прибудет через:</span>
                      <motion.span
                        key={driver.eta}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-yellow-600"
                      >
                        {Math.ceil(driver.eta)} мин
                      </motion.span>
                    </div>
                  </motion.div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold"
                    >
                      📞 Позвонить
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancel}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                    >
                      Отменить
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {orderStatus === 'coming' && driver && (
                <motion.div
                  key="coming"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      🚗
                    </div>
                    <h3 className="text-lg font-bold mb-1">Водитель в пути</h3>
                    <p className="text-gray-600 text-sm">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.car} • {driver.plate}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/60 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Прибудет через:</span>
                      <motion.span
                        key={driver.eta}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-yellow-600"
                      >
                        {Math.ceil(driver.eta)} мин
                      </motion.span>
                    </div>
                  </motion.div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold"
                    >
                      📞 Позвонить
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancel}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                    >
                      Отменить
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {orderStatus === 'arrived' && driver && (
                <motion.div
                  key="arrived"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      ✅
                    </div>
                    <h3 className="text-lg font-bold mb-1">Водитель прибыл!</h3>
                    <p className="text-gray-600 text-sm">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.car} • {driver.plate}</p>
                  </motion.div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleStartRide}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-xl font-bold"
                  >
                    Начать поездку
                  </motion.button>
                </motion.div>
              )}

              {orderStatus === 'riding' && driver && (
                <motion.div
                  key="riding"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      🚕
                    </div>
                    <h3 className="text-lg font-bold mb-1">В пути</h3>
                    <p className="text-gray-600 text-sm">{driver.name}</p>
                    <p className="text-xs text-gray-500">{driver.car} • {driver.plate}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/60 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Осталось:</span>
                      <motion.span
                        key={duration}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-bold text-yellow-500"
                      >
                        ~{Math.ceil(duration)} мин
                      </motion.span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {orderStatus === 'completed' && driver && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      ✓
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-800">Поездка завершена!</h3>
                    <p className="text-gray-600 text-sm mb-1">{driver.name}</p>
                    <p className="text-xs text-gray-500 mb-4">{driver.car} • {driver.plate}</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50/80 rounded-xl p-4 border-2 border-green-200"
                  >
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-green-600 font-semibold">Заказ выполнен</span>
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Спасибо за поездку!
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-xs text-gray-500"
                  >
                    Оцените поездку ниже
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default OrderStatusPanel

