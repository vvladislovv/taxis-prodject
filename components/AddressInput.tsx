'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRideStore } from '@/store/rideStore'
import { useAddressStore } from '@/store/addressStore'

const AddressInput = () => {
  const { fromAddress, toAddress, setFromAddress, setToAddress, fromCoords, toCoords, mapClickMode, setMapClickMode, centerMapOnCoords } = useRideStore()
  const { suggestions, getSuggestions, savedAddresses, history } = useAddressStore()
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [fromQuery, setFromQuery] = useState(fromAddress)
  const [toQuery, setToQuery] = useState(toAddress)
  const fromRef = useRef<HTMLDivElement>(null)
  const toRef = useRef<HTMLDivElement>(null)
  
  // Определяем, был ли адрес выбран с карты
  const fromSelectedFromMap = !!fromCoords && fromAddress && fromAddress !== '' && fromAddress !== 'Определение адреса...'
  const toSelectedFromMap = !!toCoords && toAddress && toAddress !== '' && toAddress !== 'Определение адреса...'
  
  const handleSelectOnMap = (type: 'from' | 'to') => {
    // Всегда активируем режим размещения стикера на карте
    // Если режим уже активен для этого типа, отключаем его
    if (mapClickMode === type) {
      setMapClickMode(null)
    } else {
      setMapClickMode(type)
      // Если координаты уже есть, центрируем карту на них для удобства
      const coords = type === 'from' ? fromCoords : toCoords
      if (coords && centerMapOnCoords) {
        setTimeout(() => centerMapOnCoords(coords), 100)
      }
    }
  }

  useEffect(() => {
    setFromQuery(fromAddress)
  }, [fromAddress])

  useEffect(() => {
    setToQuery(toAddress)
  }, [toAddress])

  useEffect(() => {
    if (fromQuery) {
      getSuggestions(fromQuery)
    }
  }, [fromQuery, getSuggestions])

  useEffect(() => {
    if (toQuery) {
      getSuggestions(toQuery)
    }
  }, [toQuery, getSuggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false)
      }
      if (toRef.current && !toRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFromChange = (value: string) => {
    setFromQuery(value)
    setFromAddress(value)
    setShowFromSuggestions(true)
  }

  const handleToChange = (value: string) => {
    setToQuery(value)
    setToAddress(value)
    setShowToSuggestions(true)
  }

  const selectSuggestion = async (address: string, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromAddress(address)
      setFromQuery(address)
      setShowFromSuggestions(false)
      // Геокодирование произойдет автоматически через useEffect в MapView
    } else {
      setToAddress(address)
      setToQuery(address)
      setShowToSuggestions(false)
      // Геокодирование произойдет автоматически через useEffect в MapView
    }
  }

  // Убрана функция геолокации - используем только тестовые данные

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Поле "Откуда" */}
      <div ref={fromRef} className="relative">
        <motion.div
          whileFocus={{ scale: 1.01 }}
          className="flex items-center space-x-3"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 shadow-md"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Откуда?"
              value={fromQuery}
              onChange={(e) => handleFromChange(e.target.value)}
              onFocus={() => setShowFromSuggestions(true)}
              className={`w-full bg-white backdrop-blur-sm border-2 rounded-xl pl-10 pr-16 py-3 text-sm focus:outline-none transition-all shadow-md ${
                fromSelectedFromMap
                  ? 'border-green-500 bg-green-50/30' 
                  : mapClickMode === 'from'
                  ? 'border-green-400 bg-green-50/20'
                  : 'border-gray-200'
              }`}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📍</span>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 z-10">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectOnMap('from')
                }}
                className={`p-2 rounded-full transition-all shadow-sm ${
                  mapClickMode === 'from'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600'
                }`}
                title="Выбрать на карте"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {showFromSuggestions && (suggestions.length > 0 || savedAddresses.length > 0 || history.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto shadow-2xl border border-white/30"
            >
              {savedAddresses.length > 0 && (
                <div className="p-2 border-b border-white/20">
                  <div className="text-xs text-gray-600 px-2 py-1 font-semibold">Сохраненные места</div>
                  {savedAddresses.map((addr) => (
                    <motion.button
                      key={addr.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectSuggestion(addr.address, 'from')}
                      className="w-full text-left px-3 py-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm">{addr.name}</div>
                      <div className="text-xs text-gray-600">{addr.address}</div>
                    </motion.button>
                  ))}
                </div>
              )}
              {history.length > 0 && (
                <div className="p-2 border-b border-white/20">
                  <div className="text-xs text-gray-600 px-2 py-1 font-semibold">История</div>
                  {history.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Устанавливаем оба адреса из истории
                        setFromAddress(item.fromAddress)
                        setFromQuery(item.fromAddress)
                        setToAddress(item.toAddress)
                        setToQuery(item.toAddress)
                        setShowFromSuggestions(false)
                        setShowToSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/30 rounded-lg transition-colors bg-gray-200/40"
                    >
                      <div className="text-sm text-gray-700">{item.fromAddress}</div>
                      <div className="text-xs text-gray-500">→ {item.toAddress}</div>
                    </motion.button>
                  ))}
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectSuggestion(suggestion, 'from')}
                  className="w-full text-left px-4 py-3 hover:bg-white/50 transition-colors border-b border-white/10 last:border-0"
                >
                  <div className="text-sm">{suggestion}</div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Поле "Куда" */}
      <div ref={toRef} className="relative">
        <motion.div
          whileFocus={{ scale: 1.01 }}
          className="flex items-center space-x-3"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 shadow-md"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Куда?"
              value={toQuery}
              onChange={(e) => handleToChange(e.target.value)}
              onFocus={() => setShowToSuggestions(true)}
              className={`w-full bg-white backdrop-blur-sm border-2 rounded-xl pl-10 pr-16 py-3 text-sm focus:outline-none transition-all shadow-md ${
                toSelectedFromMap
                  ? 'border-red-500 bg-red-50/30' 
                  : mapClickMode === 'to'
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-gray-200'
              }`}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🎯</span>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelectOnMap('to')
              }}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all shadow-sm z-10 ${
                mapClickMode === 'to'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600'
              }`}
              title="Выбрать на карте"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {showToSuggestions && (suggestions.length > 0 || savedAddresses.length > 0 || history.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto shadow-2xl border border-white/30"
            >
              {savedAddresses.length > 0 && (
                <div className="p-2 border-b border-white/20">
                  <div className="text-xs text-gray-600 px-2 py-1 font-semibold">Сохраненные места</div>
                  {savedAddresses.map((addr) => (
                    <motion.button
                      key={addr.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectSuggestion(addr.address, 'to')}
                      className="w-full text-left px-3 py-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm">{addr.name}</div>
                      <div className="text-xs text-gray-600">{addr.address}</div>
                    </motion.button>
                  ))}
                </div>
              )}
              {history.length > 0 && (
                <div className="p-2 border-b border-white/20">
                  <div className="text-xs text-gray-600 px-2 py-1 font-semibold">История</div>
                  {history.map((item) => (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Устанавливаем оба адреса из истории
                        setFromAddress(item.fromAddress)
                        setFromQuery(item.fromAddress)
                        setToAddress(item.toAddress)
                        setToQuery(item.toAddress)
                        setShowFromSuggestions(false)
                        setShowToSuggestions(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white/30 rounded-lg transition-colors bg-gray-200/40"
                    >
                      <div className="text-sm text-gray-700">{item.toAddress}</div>
                      <div className="text-xs text-gray-500">← {item.fromAddress}</div>
                    </motion.button>
                  ))}
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectSuggestion(suggestion, 'to')}
                  className="w-full text-left px-4 py-3 hover:bg-white/50 transition-colors border-b border-white/10 last:border-0"
                >
                  <div className="text-sm">{suggestion}</div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AddressInput
