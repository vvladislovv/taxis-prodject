'use client'

import { motion } from 'framer-motion'
import { useRideStore, CarClass } from '@/store/rideStore'

const carClasses = [
  {
    id: 'economy' as CarClass,
    name: 'Эконом',
    icon: '🚕',
    description: 'Бюджетный вариант',
    price: 'от 150₽',
    features: ['Кондиционер', 'Бесплатный Wi-Fi'],
    color: 'yellow',
  },
  {
    id: 'comfort' as CarClass,
    name: 'Комфорт',
    icon: '🚙',
    description: 'Средний класс',
    price: 'от 250₽',
    features: ['Кондиционер', 'Wi-Fi', 'Больше места'],
    color: 'blue',
  },
  {
    id: 'business' as CarClass,
    name: 'Бизнес',
    icon: '🚗',
    description: 'Премиум класс',
    price: 'от 400₽',
    features: ['Премиум авто', 'Wi-Fi', 'Вода', 'Зарядка'],
    color: 'red',
  },
]

const CarClassSelector = () => {
  const { carClass, setCarClass } = useRideStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🚗</span>
          <h3 className="text-lg font-bold text-gray-800">Выберите класс автомобиля</h3>
        </div>
        <span className="text-xs text-gray-500 bg-white/60 px-3 py-1 rounded-full font-medium shadow-sm">3 варианта</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {carClasses.map((car, index) => (
          <motion.button
            key={car.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setCarClass(car.id)}
            className={`relative p-4 rounded-xl transition-all overflow-hidden ${
              carClass === car.id
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-xl ring-2 ring-yellow-300 ring-offset-2'
                : 'bg-white/70 hover:bg-white/90 shadow-md'
            }`}
          >
            {carClass === car.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-2"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
            
            <motion.div
              animate={carClass === car.id ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.6 }}
              className="text-4xl mb-2 flex justify-center"
            >
              {car.icon}
            </motion.div>
            
            <div className={`font-bold text-sm mb-1 ${carClass === car.id ? 'text-gray-900' : 'text-gray-800'}`}>
              {car.name}
            </div>
            
            <div className={`text-xs mb-2 ${carClass === car.id ? 'text-gray-700 font-semibold' : 'text-gray-600'}`}>
              {car.price}
            </div>
            
            {carClass === car.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pt-2 border-t border-yellow-300/50"
              >
                <div className="text-[10px] text-gray-700 space-y-1">
                  {car.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-1">
                      <span className="text-yellow-600">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default CarClassSelector
