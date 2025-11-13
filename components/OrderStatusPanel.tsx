'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'
import { useEffect } from 'react'

const OrderStatusPanel = () => {
  const { orderStatus, driver, setOrderStatus, setDriver, reset, fromCoords, toCoords, duration } = useRideStore()

  // Симуляция движения водителя к точке отправления
  useEffect(() => {
    if (orderStatus === 'coming' && driver && fromCoords) {
      // Симулируем движение водителя от начальной точки к точке отправления
      const interval = setInterval(() => {
        if (driver.location) {
          const [lat, lng] = driver.location
          const [targetLat, targetLng] = fromCoords
          
          const newLat = lat + (targetLat - lat) * 0.1
          const newLng = lng + (targetLng - lng) * 0.1
          
          setDriver({ ...driver, location: [newLat, newLng] })
          
          // Если водитель близко к точке отправления, меняем статус
          if (Math.abs(newLat - targetLat) < 0.001 && Math.abs(newLng - targetLng) < 0.001) {
            setOrderStatus('arrived')
            clearInterval(interval)
          }
        }
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [orderStatus, driver, fromCoords, setDriver, setOrderStatus])

  // Симуляция движения во время поездки
  useEffect(() => {
    if (orderStatus === 'riding' && driver && fromCoords && toCoords) {
      // Симулируем движение от точки отправления к точке назначения
      const interval = setInterval(() => {
        if (driver.location) {
          const [lat, lng] = driver.location
          const [targetLat, targetLng] = toCoords
          
          const newLat = lat + (targetLat - lat) * 0.05
          const newLng = lng + (targetLng - lng) * 0.05
          
          setDriver({ ...driver, location: [newLat, newLng] })
          
          // Если водитель близко к точке назначения, завершаем поездку
          if (Math.abs(newLat - targetLat) < 0.001 && Math.abs(newLng - targetLng) < 0.001) {
            setOrderStatus('completed')
            clearInterval(interval)
          }
        }
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [orderStatus, driver, fromCoords, toCoords, setDriver, setOrderStatus])

  // Инициализация местоположения водителя
  useEffect(() => {
    if (orderStatus === 'found' && driver && fromCoords && !driver.location) {
      // Водитель находится немного в стороне от точки отправления
      const offsetLat = fromCoords[0] + (Math.random() - 0.5) * 0.01
      const offsetLng = fromCoords[1] + (Math.random() - 0.5) * 0.01
      setDriver({ ...driver, location: [offsetLat, offsetLng] })
    }
    
    // При начале поездки водитель находится в точке отправления
    if (orderStatus === 'riding' && driver && fromCoords && (!driver.location || Math.abs(driver.location[0] - fromCoords[0]) > 0.001)) {
      setDriver({ ...driver, location: fromCoords })
    }
  }, [orderStatus, driver, fromCoords, setDriver])

  if (!orderStatus || orderStatus === 'completed') return null

  const handleCancel = () => {
    setOrderStatus(null)
    reset()
  }

  const handleStartRide = () => {
    setOrderStatus('riding')
    // Симуляция поездки
    setTimeout(() => {
      setOrderStatus('completed')
    }, 10000) // 10 секунд симуляции поездки
  }

  return (
    <AnimatePresence>
      {orderStatus && (
        <>
          {/* Кнопка закрытия вверху */}
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
                        {driver.eta} мин
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
                        {driver.eta} мин
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
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
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
                        className="text-2xl font-bold text-blue-600"
                      >
                        ~{duration} мин
                      </motion.span>
                    </div>
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

