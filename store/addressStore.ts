'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SavedAddress {
  id: string
  name: string
  address: string
  type: 'home' | 'work' | 'other'
}

export interface HistoryItem {
  id: string
  fromAddress: string
  toAddress: string
  date: string
}

interface AddressState {
  savedAddresses: SavedAddress[]
  suggestions: string[]
  history: HistoryItem[]
  addAddress: (address: SavedAddress) => void
  removeAddress: (id: string) => void
  addToHistory: (fromAddress: string, toAddress: string) => void
  clearHistory: () => void
  getSuggestions: (query: string) => void
}

// Тестовые данные для автоподсказок
const testAddresses = [
  'Москва, Красная площадь, 1',
  'Москва, Тверская улица, 10',
  'Москва, Арбат, 25',
  'Москва, Ленинский проспект, 50',
  'Москва, Кутузовский проспект, 15',
  'Москва, Садовое кольцо, 100',
  'Москва, ВДНХ, проспект Мира, 119',
  'Москва, Парк Горького, Крымский Вал, 9',
  'Москва, Сокольники, Сокольнический Вал, 1',
  'Москва, Измайловский парк, аллея Большого Круга',
]

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      savedAddresses: [
        { id: '1', name: 'Дом', address: 'Москва, ул. Ленина, 10', type: 'home' },
        { id: '2', name: 'Работа', address: 'Москва, ул. Тверская, 5', type: 'work' },
      ],
      suggestions: [],
      history: [],
      
      addAddress: (address) => {
        const { savedAddresses } = get()
        set({ savedAddresses: [...savedAddresses, address] })
      },
      
      removeAddress: (id) => {
        const { savedAddresses } = get()
        set({ savedAddresses: savedAddresses.filter(a => a.id !== id) })
      },
      
      addToHistory: (fromAddress, toAddress) => {
        if (!fromAddress || !toAddress || fromAddress.trim() === '' || toAddress.trim() === '') {
          return // Не добавляем пустые адреса
        }
        const { history } = get()
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          fromAddress: fromAddress.trim(),
          toAddress: toAddress.trim(),
          date: new Date().toISOString(),
        }
        // Добавляем в начало и ограничиваем 20 последними, убираем дубликаты
        const updatedHistory = [newItem, ...history.filter(
          item => !(item.fromAddress.trim() === fromAddress.trim() && item.toAddress.trim() === toAddress.trim())
        )].slice(0, 20)
        set({ history: updatedHistory })
      },
      
      clearHistory: () => {
        set({ history: [] })
      },
      
      getSuggestions: async (query) => {
        if (!query || query.length < 2) {
          set({ suggestions: [] })
          return
        }
        
        // Используем только тестовые данные для демо
        // Имитируем задержку API для реалистичности
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const filtered = testAddresses
          .filter(addr => 
            addr.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
        
        set({ suggestions: filtered })
      },
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

