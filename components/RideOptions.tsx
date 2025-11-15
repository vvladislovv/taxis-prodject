'use client'

import { motion } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'

const RideOptions = () => {
  const { childSeat, luggage, setChildSeat, setLuggage } = useRideStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">⚙️</span>
          <h3 className="text-lg font-bold text-gray-800">Дополнительные опции</h3>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium shadow-sm ${
          (childSeat ? 1 : 0) + (luggage ? 1 : 0) > 0 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-white/60 text-gray-500'
        }`}>
          {(childSeat ? 1 : 0) + (luggage ? 1 : 0)} выбрано
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <motion.label
          whileTap={{ scale: 0.95 }}
          className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all ${
            childSeat
              ? 'bg-yellow-50 border-2 border-yellow-300 shadow-md'
              : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <motion.div
            animate={childSeat ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="text-4xl mb-2"
          >
            🪑
          </motion.div>
          <div className="text-center">
            <div className={`font-bold text-sm mb-1 ${childSeat ? 'text-gray-900' : 'text-gray-800'}`}>
              Детское кресло
            </div>
            <div className={`text-xs font-semibold ${childSeat ? 'text-yellow-600' : 'text-gray-600'}`}>
              +50₽
            </div>
          </div>
          <motion.input
            whileTap={{ scale: 0.9 }}
            type="checkbox"
            checked={childSeat}
            onChange={(e) => setChildSeat(e.target.checked)}
            className="absolute top-2 right-2 w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400 focus:ring-2 cursor-pointer"
          />
          {childSeat && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">✓</span>
            </motion.div>
          )}
        </motion.label>

        <motion.label
          whileTap={{ scale: 0.95 }}
          className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all ${
            luggage
              ? 'bg-yellow-50 border-2 border-yellow-300 shadow-md'
              : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <motion.div
            animate={luggage ? { scale: [1, 1.2, 1], y: [0, -3, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="text-4xl mb-2"
          >
            🧳
          </motion.div>
          <div className="text-center">
            <div className={`font-bold text-sm mb-1 ${luggage ? 'text-gray-900' : 'text-gray-800'}`}>
              Багаж
            </div>
            <div className={`text-xs font-semibold ${luggage ? 'text-yellow-600' : 'text-gray-600'}`}>
              +30₽
            </div>
          </div>
          <motion.input
            whileTap={{ scale: 0.9 }}
            type="checkbox"
            checked={luggage}
            onChange={(e) => setLuggage(e.target.checked)}
            className="absolute top-2 right-2 w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400 focus:ring-2 cursor-pointer"
          />
          {luggage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">✓</span>
            </motion.div>
          )}
        </motion.label>
      </div>
    </motion.div>
  )
}

export default RideOptions
