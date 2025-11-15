'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MapView from './MapView'

interface DriverTrackingProps {
  onCancel: () => void
}

const DriverTracking = ({ onCancel }: DriverTrackingProps) => {
  const [status, setStatus] = useState<'searching' | 'found' | 'coming' | 'arrived'>('searching')
  const [driver, setDriver] = useState<{
    name: string
    car: string
    plate: string
    rating: number
    eta: number
  } | null>(null)
  const [searchProgress, setSearchProgress] = useState(0)

  useEffect(() => {
    // Симуляция поиска водителя с прогрессом
    // Увеличен интервал до 100ms для лучшей производительности
    const progressInterval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 3 // Увеличено для компенсации большего интервала
      })
    }, 100) // Увеличен с 60ms до 100ms

    const searchTimer = setTimeout(() => {
      setStatus('found')
      setDriver({
        name: 'Иван Петров',
        car: 'Toyota Camry',
        plate: 'А123БВ 777',
        rating: 4.8,
        eta: 5,
      })
      setSearchProgress(100)
      clearInterval(progressInterval)
    }, 3000)

    return () => {
      clearTimeout(searchTimer)
      clearInterval(progressInterval)
    }
  }, [])

  useEffect(() => {
    if (status === 'found') {
      const comingTimer = setTimeout(() => {
        setStatus('coming')
        if (driver) {
          setDriver({ ...driver, eta: driver.eta - 2 })
        }
      }, 5000)

      return () => clearTimeout(comingTimer)
    }
  }, [status, driver])

  useEffect(() => {
    if (status === 'coming' && driver) {
      const arrivedTimer = setTimeout(() => {
        setStatus('arrived')
      }, 10000)

      return () => clearTimeout(arrivedTimer)
    }
  }, [status, driver])

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <MapView />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-0 left-0 right-0 z-10 p-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCancel}
          className="glass rounded-full p-2 mb-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 z-10 p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="glass rounded-t-3xl p-6">
          <AnimatePresence mode="wait">
            {status === 'searching' && (
              <motion.div
                key="searching"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-6"
                />
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold mb-2 text-gray-800"
                >
                  Поиск водителя
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-4"
                >
                  Пожалуйста, подождите...
                </motion.p>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${searchProgress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 mt-2"
                >
                  {searchProgress}%
                </motion.p>
              </motion.div>
            )}

            {status === 'found' && driver && (
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
                  <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                    👤
                  </div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold mb-1"
                  >
                    {driver.name}
                  </motion.h3>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center space-x-2 mb-2"
                  >
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold">{driver.rating}</span>
                  </motion.div>
                  <p className="text-gray-600">{driver.car}</p>
                  <p className="text-sm text-gray-500">{driver.plate}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex space-x-3"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold"
                  >
                    📞 Позвонить
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                  >
                    Отменить
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {status === 'coming' && driver && (
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
                  <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                    🚗
                  </div>
                  <h3 className="text-xl font-bold mb-1">Водитель в пути</h3>
                  <p className="text-gray-600">{driver.name}</p>
                  <p className="text-sm text-gray-500">{driver.car} • {driver.plate}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/60 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Прибудет через:</span>
                    <motion.span
                      key={Math.max(1, driver.eta - 2)}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-yellow-600"
                    >
                      {Math.max(1, driver.eta - 2)} мин
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
                    onClick={onCancel}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
                  >
                    Отменить
                  </motion.button>
                </div>
              </motion.div>
            )}

            {status === 'arrived' && driver && (
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
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                    ✅
                  </div>
                  <h3 className="text-xl font-bold mb-1">Водитель прибыл!</h3>
                  <p className="text-gray-600">{driver.name}</p>
                  <p className="text-sm text-gray-500">{driver.car} • {driver.plate}</p>
                </motion.div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={onCancel}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-3 rounded-xl font-bold"
                >
                  Начать поездку
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export default DriverTracking
