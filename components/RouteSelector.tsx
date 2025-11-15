'use client'

import { motion } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'

const RouteSelector = () => {
  const { routeAlternatives, selectedRouteIndex, setSelectedRouteIndex } = useRideStore()

  if (!routeAlternatives || routeAlternatives.length <= 1) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Альтернативные маршруты
      </div>
      <div className="space-y-2">
        {routeAlternatives.map((route, index) => {
          const isSelected = index === selectedRouteIndex
          const distance = Math.round(route.distance * 10) / 10
          const duration = Math.round(route.duration)
          
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRouteIndex(index)}
              className={`w-full p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-yellow-50 border-2 border-yellow-400 shadow-md'
                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Маршрут {index + 1}</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {distance} км · {duration} мин
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-yellow-600 font-bold"
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

export default RouteSelector

