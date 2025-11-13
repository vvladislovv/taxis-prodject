'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAddressStore } from '@/store/addressStore'

const ProfilePage = () => {
  const router = useRouter()
  const { history, clearHistory, savedAddresses, removeAddress } = useAddressStore()
  const [notifications, setNotifications] = useState(true)
  const [sound, setSound] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 pb-20"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-b-3xl p-6 mb-4"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="mb-4 text-gray-700"
        >
          ← Назад
        </motion.button>
        <h1 className="text-2xl font-bold text-gray-800">Профиль</h1>
      </motion.div>

      <div className="px-4 space-y-4">
        {/* Настройки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Настройки</h2>
          
          <div className="space-y-4">
            <motion.label
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-sm">Уведомления</div>
                <div className="text-xs text-gray-600">Получать уведомления о поездках</div>
              </div>
              <motion.input
                whileTap={{ scale: 0.9 }}
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5 text-yellow-400 rounded focus:ring-yellow-400 focus:ring-2"
              />
            </motion.label>

            <motion.label
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-sm">Звук</div>
                <div className="text-xs text-gray-600">Звуковые уведомления</div>
              </div>
              <motion.input
                whileTap={{ scale: 0.9 }}
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                className="w-5 h-5 text-yellow-400 rounded focus:ring-yellow-400 focus:ring-2"
              />
            </motion.label>
          </div>
        </motion.div>

        {/* Сохраненные адреса */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Сохраненные адреса</h2>
          
          {savedAddresses.length > 0 ? (
            <div className="space-y-3">
              {savedAddresses.map((addr, index) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white/60 rounded-xl"
                >
                  <div>
                    <div className="font-medium text-sm">{addr.name}</div>
                    <div className="text-xs text-gray-600">{addr.address}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeAddress(addr.id)}
                    className="text-red-500 text-sm"
                  >
                    Удалить
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Нет сохраненных адресов</p>
          )}
        </motion.div>

        {/* История поездок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">История поездок</h2>
            {history.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={clearHistory}
                className="text-xs text-red-500"
              >
                Очистить
              </motion.button>
            )}
          </div>
          
          {history.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-3 bg-gray-200/40 rounded-xl"
                >
                  <div className="text-sm text-gray-700">{item.fromAddress}</div>
                  <div className="text-xs text-gray-500 my-1">→</div>
                  <div className="text-sm text-gray-700">{item.toAddress}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).toLocaleString('ru-RU')}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">История пуста</p>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProfilePage
