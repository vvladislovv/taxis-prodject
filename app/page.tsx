'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import AddressInput from '@/components/AddressInput'
import CollapsiblePanel from '@/components/CollapsiblePanel'
import OrderStatusPanel from '@/components/OrderStatusPanel'
import RatingPanel from '@/components/RatingPanel'
import { useRideStore } from '@/store/rideStore'

// Динамический импорт MapView с отключенным SSR для избежания проблем с hydration
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Загрузка карты...</p>
      </div>
    </div>
  )
})

const Home = () => {
  const router = useRouter()
  const { 
    fromAddress, 
    toAddress,
    carClass,
    price,
    duration,
    orderStatus
  } = useRideStore()

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((sdk) => {
        if (sdk.init) {
          sdk.init()
        }
      }).catch(() => {
        console.log('Telegram SDK не доступен, работаем в обычном режиме')
      })
    }
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden" suppressHydrationWarning>
      <MapView />
      
      <AnimatePresence mode="wait">
        {!orderStatus && (
          <motion.div
            key="address-panel"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 left-0 right-0 z-10 p-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            suppressHydrationWarning
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex items-center space-x-2 mb-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/profile')}
                className="glass rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-4 mb-4 shadow-xl border border-white/30"
            >
              <AddressInput />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(fromAddress && toAddress) && !orderStatus && (
          <div suppressHydrationWarning>
            <CollapsiblePanel
              fromAddress={fromAddress}
              toAddress={toAddress}
              carClass={carClass}
              price={price}
              duration={duration}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Панель статуса заказа - показывается поверх карты когда заказ создан */}
      <OrderStatusPanel />
      
      {/* Панель оценки - показывается после завершения поездки */}
      {orderStatus === 'completed' && <RatingPanel />}
    </main>
  )
}

export default Home
