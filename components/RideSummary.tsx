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
  const { reset, carClass: storeCarClass, price: storePrice, fixedPrice, duration: storeDuration, distance, childSeat, luggage, setOrderStatus, setDriver } = useRideStore()
  const { addToHistory } = useAddressStore()
  const finalCarClass = carClass || storeCarClass
  // Используем зафиксированную цену если она есть, иначе обычную цену
  const price = fixedPrice !== null ? fixedPrice : (storePrice > 0 ? storePrice : priceProp)
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
    
    // Фиксируем цену после заказа
    const { setFixedPrice } = useRideStore.getState()
    setFixedPrice(price)
    
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
    
    // Выбираем водителя в зависимости от класса автомобиля
    const ECONOMY_DRIVERS = [
      {
        name: 'Иван Петров',
        car: 'Toyota Camry',
        plate: 'А123БВ 777',
        rating: 4.8,
      },
      {
        name: 'Алексей Смирнов',
        car: 'Hyundai Solaris',
        plate: 'В456ГД 123',
        rating: 4.9,
      },
      {
        name: 'Сергей Козлов',
        car: 'Kia Rio',
        plate: 'Д012ЗИ 789',
        rating: 4.7,
      },
      {
        name: 'Андрей Новиков',
        car: 'Lada Granta',
        plate: 'Ж567МН 234',
        rating: 4.6,
      },
    ]
    
    const COMFORT_DRIVERS = [
      {
        name: 'Максим Соколов',
        car: 'Toyota Camry',
        plate: 'К890ОП 345',
        rating: 4.9,
      },
      {
        name: 'Павел Морозов',
        car: 'Skoda Octavia',
        plate: 'П123РС 456',
        rating: 4.8,
      },
      {
        name: 'Владимир Лебедев',
        car: 'Volkswagen Passat',
        plate: 'Т456УФ 567',
        rating: 4.9,
      },
    ]
    
    const BUSINESS_DRIVERS = [
      {
        name: 'Дмитрий Иванов',
        car: 'Mercedes-Benz E-Class',
        plate: 'С789ЕЖ 456',
        rating: 5.0,
      },
      {
        name: 'Михаил Волков',
        car: 'BMW 5 Series',
        plate: 'Е345КЛ 012',
        rating: 4.9,
      },
      {
        name: 'Александр Орлов',
        car: 'Mercedes-Benz S-Class',
        plate: 'Х789ЦЧ 678',
        rating: 5.0,
      },
      {
        name: 'Роман Богданов',
        car: 'Audi A6',
        plate: 'Ш012ЩЫ 789',
        rating: 4.9,
      },
      {
        name: 'Игорь Медведев',
        car: 'Mercedes-Benz C-Class',
        plate: 'Э345ЮЯ 890',
        rating: 5.0,
      },
      {
        name: 'Николай Федоров',
        car: 'BMW 7 Series',
        plate: 'Я678АБ 901',
        rating: 5.0,
      },
    ]
    
    // Выбираем водителя в зависимости от класса
    let availableDrivers = ECONOMY_DRIVERS
    if (finalCarClass === 'comfort') {
      availableDrivers = COMFORT_DRIVERS
    } else if (finalCarClass === 'business') {
      availableDrivers = BUSINESS_DRIVERS
    }
    
    const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)]
    
    // Симуляция поиска водителя (2-4 секунды)
    const searchTime = 2000 + Math.random() * 2000
    setTimeout(() => {
      setOrderStatus('found')
      // Округляем ETA вверх до целых минут (3-6 минут)
      const initialEta = Math.ceil(3 + Math.random() * 4)
      setDriver({
        ...randomDriver,
        eta: initialEta,
      })
      
      // Через 3-5 секунд водитель в пути
      setTimeout(() => {
        setOrderStatus('coming')
        setDriver({
          ...randomDriver,
          eta: Math.max(1, initialEta - 2),
        })
      }, 3000 + Math.random() * 2000)
    }, searchTime)
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
          className="flex items-center justify-between p-3 bg-yellow-50/50 rounded-xl border border-yellow-200/30"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚗</span>
            <span className="text-sm text-gray-600">Прибытие примерно в</span>
          </div>
          <span className="text-sm font-bold text-blue-700">{arrivalTimeString}</span>
        </motion.div>

        {/* Детализация стоимости с визуализацией точности */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/50 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Детализация стоимости</div>
            <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <span>✓</span>
              <span>Точный расчет</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Базовая стоимость ({carClassNames[finalCarClass as keyof typeof carClassNames]})</span>
              <span className="font-medium text-gray-800">{basePrice}₽</span>
            </div>
            
            {distancePrice > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                <span className="text-gray-600">За расстояние ({distance} км)</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full" title="Расчет на основе реального маршрута">
                    📍
                  </span>
                </div>
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
                  className="text-2xl font-bold text-yellow-500"
                >
                  {price}₽
                </motion.span>
              </div>
              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center space-x-1 mb-1">
                  <span>ℹ️</span>
                  <span className="font-semibold">Что вы получите:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  <li>Точная стоимость поездки</li>
                  <li>Время в пути: ~{duration} минут</li>
                  <li>Расстояние: {distance > 0 ? `${distance} км` : 'рассчитывается'}</li>
                  <li>Без скрытых комиссий</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleOrder}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-6 rounded-xl shadow-lg transition-all transform hover:shadow-xl"
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
