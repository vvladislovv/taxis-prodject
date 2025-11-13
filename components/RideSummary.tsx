'use client'

import { motion } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'
import { useAddressStore } from '@/store/addressStore'

interface RideSummaryProps {
  price: number
  duration: number
  fromAddress: string
  toAddress: string
  carClass: string
}

const RideSummary = ({ price: priceProp, duration: durationProp, fromAddress, toAddress, carClass }: RideSummaryProps) => {
  const { reset, carClass: storeCarClass, price: storePrice, duration: storeDuration, distance, childSeat, luggage, setOrderStatus, setDriver } = useRideStore()
  const { addToHistory } = useAddressStore()
  const finalCarClass = carClass || storeCarClass
  // Используем цену из store, если она доступна, иначе из пропсов
  const price = storePrice > 0 ? storePrice : priceProp
  const duration = storeDuration > 0 ? storeDuration : durationProp
  
  // Расчет детализации стоимости
  const basePrices = {
    economy: 150,
    comfort: 250,
    business: 400,
  }
  const basePrice = basePrices[finalCarClass as keyof typeof basePrices] || 150
  const distancePrice = distance > 0 ? Math.round((price - basePrice - (childSeat ? 50 : 0) - (luggage ? 30 : 0)) * 10) / 10 : 0
  const childSeatPrice = childSeat ? 50 : 0
  const luggagePrice = luggage ? 30 : 0
  
  // Время прибытия
  const arrivalTime = new Date(Date.now() + duration * 60000)
  const arrivalTimeString = arrivalTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const handleOrder = () => {
    addToHistory(fromAddress, toAddress)
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    const newOrder = {
      id: Date.now().toString(),
      fromAddress,
      toAddress,
      carClass: finalCarClass,
      price,
      duration,
      date: new Date().toISOString(),
      status: 'searching',
    }
    orders.push(newOrder)
    localStorage.setItem('orders', JSON.stringify(orders))
    
    // Устанавливаем статус заказа
    setOrderStatus('searching')
    
    // Симуляция поиска водителя
    setTimeout(() => {
      setOrderStatus('found')
      setDriver({
        name: 'Иван Петров',
        car: 'Toyota Camry',
        plate: 'А123БВ 777',
        rating: 4.8,
        eta: 5,
      })
      
      // Через 5 секунд водитель в пути
      setTimeout(() => {
        setOrderStatus('coming')
        setDriver({
          name: 'Иван Петров',
          car: 'Toyota Camry',
          plate: 'А123БВ 777',
          rating: 4.8,
          eta: 3,
        })
      }, 5000)
    }, 3000)
  }

  const carClassNames = {
    economy: 'Эконом',
    comfort: 'Комфорт',
    business: 'Бизнес',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="space-y-4 pt-4 border-t-2 border-white/40"
    >
      {/* Информация о маршруте */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📍</span>
            <div>
              <div className="text-xs text-gray-500">Расстояние</div>
              <div className="text-sm font-semibold text-gray-800">{distance > 0 ? `${distance} км` : '—'}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏱️</span>
            <div className="text-right">
              <div className="text-xs text-gray-500">Время в пути</div>
              <motion.div
                key={duration}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-sm font-semibold text-gray-800"
              >
                {duration} мин
              </motion.div>
            </div>
          </div>
        </div>

        {/* Время прибытия */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-xl border border-blue-200/30"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚗</span>
            <span className="text-sm text-gray-600">Прибытие примерно в</span>
          </div>
          <span className="text-sm font-bold text-blue-700">{arrivalTimeString}</span>
        </motion.div>

        {/* Детализация стоимости */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 rounded-xl p-4 space-y-2"
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Детализация стоимости</div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Базовая стоимость ({carClassNames[finalCarClass as keyof typeof carClassNames]})</span>
              <span className="font-medium text-gray-800">{basePrice}₽</span>
            </div>
            
            {distancePrice > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">За расстояние ({distance} км)</span>
                <span className="font-medium text-gray-800">{Math.round(distancePrice)}₽</span>
              </div>
            )}
            
            {childSeatPrice > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600 flex items-center space-x-1">
                  <span>🪑</span>
                  <span>Детское кресло</span>
                </span>
                <span className="font-medium text-gray-800">+{childSeatPrice}₽</span>
              </motion.div>
            )}
            
            {luggagePrice > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600 flex items-center space-x-1">
                  <span>🧳</span>
                  <span>Багаж</span>
                </span>
                <span className="font-medium text-gray-800">+{luggagePrice}₽</span>
              </motion.div>
            )}
            
            <div className="pt-2 border-t border-gray-300/50 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-gray-800">Итого:</span>
                <motion.span
                  key={price}
                  initial={{ scale: 1.2, color: '#FFD700' }}
                  animate={{ scale: 1, color: '#F59E0B' }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="text-2xl font-bold text-yellow-600"
                >
                  {price}₽
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleOrder}
        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-xl shadow-xl transition-all transform hover:shadow-2xl"
      >
        <span className="flex items-center justify-center space-x-2">
          <span className="text-xl">🚕</span>
          <span>Заказать такси</span>
        </span>
      </motion.button>
    </motion.div>
  )
}

export default RideSummary
