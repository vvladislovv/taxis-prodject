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
    const coords = type === 'from' ? fromCoords : toCoords
    
    // Если координаты уже есть, центрируем карту на них
    if (coords && centerMapOnCoords) {
      centerMapOnCoords(coords)
      return
    }
    
    // Если координат нет, активируем режим выбора на карте
    if (mapClickMode === type) {
      setMapClickMode(null)
    } else {
      setMapClickMode(type)
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

  const selectSuggestion = (address: string, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromAddress(address)
      setFromQuery(address)
      setShowFromSuggestions(false)
    } else {
      setToAddress(address)
      setToQuery(address)
      setShowToSuggestions(false)
    }
  }

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
            className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 shadow-lg shadow-green-500/50"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Откуда?"
              value={fromQuery}
              onChange={(e) => handleFromChange(e.target.value)}
              onFocus={() => setShowFromSuggestions(true)}
              className={`w-full bg-white/90 backdrop-blur-sm border-2 rounded-xl pl-10 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all shadow-md ${
                fromSelectedFromMap
                  ? 'border-green-400 bg-green-50/50' 
                  : mapClickMode === 'from'
                  ? 'border-yellow-400 bg-yellow-50/50'
                  : 'border-white/40'
              }`}
            />
            {fromSelectedFromMap && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2"
              >
                <span className="text-green-500 text-xs font-semibold">✓</span>
              </motion.div>
            )}
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📍</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectOnMap('from')}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapClickMode === 'from'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              На карте
            </motion.button>
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
                      onClick={() => selectSuggestion(item.fromAddress, 'from')}
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
            className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 shadow-lg shadow-red-500/50"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Куда?"
              value={toQuery}
              onChange={(e) => handleToChange(e.target.value)}
              onFocus={() => setShowToSuggestions(true)}
              className={`w-full bg-white/90 backdrop-blur-sm border-2 rounded-xl pl-10 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all shadow-md ${
                toSelectedFromMap
                  ? 'border-red-400 bg-red-50/50' 
                  : mapClickMode === 'to'
                  ? 'border-yellow-400 bg-yellow-50/50'
                  : 'border-white/40'
              }`}
            />
            {toSelectedFromMap && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-12 top-1/2 transform -translate-y-1/2"
              >
                <span className="text-red-500 text-xs font-semibold">✓</span>
              </motion.div>
            )}
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🎯</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelectOnMap('to')}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mapClickMode === 'to'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              На карте
            </motion.button>
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
                      onClick={() => selectSuggestion(item.toAddress, 'to')}
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
