'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, PanInfo } from 'framer-motion'
import CarClassSelector from './CarClassSelector'
import RideOptions from './RideOptions'
import RideSummary from './RideSummary'
import RouteSelector from './RouteSelector'

interface CollapsiblePanelProps {
  fromAddress: string
  toAddress: string
  carClass: string
  price: number
  duration: number
}

const CollapsiblePanel = ({ fromAddress, toAddress, carClass, price, duration }: CollapsiblePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  )
  
  const minHeight = 120
  // При разворачивании панель занимает 90% экрана (почти на весь экран)
  const expandedHeight = windowHeight * 0.90
  
  // Отслеживаем изменение размера окна
  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight)
    }
    
    if (typeof window !== 'undefined') {
      updateHeight()
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    
    if (info.offset.y > threshold && isExpanded) {
      // Сворачиваем
      setIsExpanded(false)
    } else if (info.offset.y < -threshold && !isExpanded) {
      // Разворачиваем
      setIsExpanded(true)
    }
  }

  const togglePanel = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 z-10 p-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{
          height: isExpanded ? expandedHeight : minHeight,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        className="glass rounded-t-3xl shadow-2xl overflow-hidden"
      >
        {/* Ручка для перетаскивания */}
        <div
          onClick={togglePanel}
          className="flex flex-col items-center justify-center py-3 cursor-pointer touch-none select-none"
        >
          <div className="w-12 h-1.5 bg-gray-400 rounded-full mb-1" />
          <div className="text-xs text-gray-500 font-medium">
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </div>
        </div>

        {/* Контент панели */}
        <div className="overflow-hidden h-full flex flex-col">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-6 space-y-6 overflow-y-auto flex-1"
              style={{
                maxHeight: `${expandedHeight - 80}px`,
              }}
            >
              <RouteSelector />
              <CarClassSelector />
              <RideOptions />
              {price > 0 && (
                <RideSummary 
                  price={price} 
                  duration={duration}
                  fromAddress={fromAddress}
                  toAddress={toAddress}
                  carClass={carClass}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-4"
            >
              {/* Компактный вид */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-1">Маршрут</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {fromAddress.split(',')[0]} → {toAddress.split(',')[0]}
                  </div>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <div className="text-xs text-gray-500 mb-1">Стоимость</div>
                  <div className="text-xl font-bold text-yellow-500">
                    {price > 0 ? `${price}₽` : '—'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CollapsiblePanel

