'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'

const RatingPanel = () => {
  const { rating, setRating, reset, fromAddress, toAddress, price, duration } = useRideStore()
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleRatingClick = (value: number) => {
    setSelectedRating(value)
  }

  const handleSubmit = () => {
    setRating(selectedRating)
    // Через 2 секунды сбрасываем заказ
    setTimeout(() => {
      reset()
    }, 2000)
  }

  if (rating !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass rounded-3xl p-8 max-w-sm mx-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="text-6xl mb-4"
          >
            ⭐
          </motion.div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Спасибо за оценку!</h2>
          <p className="text-gray-600">Ваша оценка: {rating} звезд</p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 z-30 p-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="glass rounded-t-3xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Оцените поездку</h2>
          <p className="text-gray-600 text-sm">
            {fromAddress.split(',')[0]} → {toAddress.split(',')[0]}
          </p>
          <p className="text-gray-500 text-xs mt-1">Стоимость: {price}₽</p>
        </div>

        <div className="flex justify-center items-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingClick(star)}
              className="text-5xl transition-all"
            >
              {star <= (hoveredRating || selectedRating) ? (
                <motion.span
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                  className="text-yellow-400"
                >
                  ⭐
                </motion.span>
              ) : (
                <span className="text-gray-300">☆</span>
              )}
            </motion.button>
          ))}
        </div>

        {selectedRating > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-xl shadow-xl transition-all"
            >
              Отправить оценку
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => reset()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Пропустить
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default RatingPanel

