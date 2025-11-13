'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type CarClass = 'economy' | 'comfort' | 'business'

interface RideState {
  fromAddress: string
  toAddress: string
  fromCoords: [number, number] | null
  toCoords: [number, number] | null
  carClass: CarClass
  childSeat: boolean
  luggage: boolean
  price: number
  duration: number
  distance: number
  orderStatus: 'none' | 'searching' | 'found' | 'coming' | 'arrived' | 'riding' | 'completed' | null
  driver: {
    name: string
    car: string
    plate: string
    rating: number
    eta: number
    location?: [number, number]
  } | null
  rating: number | null
  setFromAddress: (address: string) => void
  setToAddress: (address: string) => void
  setFromCoords: (coords: [number, number] | null) => void
  setToCoords: (coords: [number, number] | null) => void
  setCarClass: (carClass: CarClass) => void
  setChildSeat: (value: boolean) => void
  setLuggage: (value: boolean) => void
  calculatePrice: (distance?: number, duration?: number) => void
  setOrderStatus: (status: 'none' | 'searching' | 'found' | 'coming' | 'arrived' | 'riding' | 'completed' | null) => void
  setDriver: (driver: { name: string; car: string; plate: string; rating: number; eta: number; location?: [number, number] } | null) => void
  setRating: (rating: number | null) => void
  mapClickMode: 'from' | 'to' | 'auto' | null
  setMapClickMode: (mode: 'from' | 'to' | 'auto' | null) => void
  centerMapOnCoords: ((coords: [number, number]) => void) | null
  setCenterMapOnCoords: (fn: ((coords: [number, number]) => void) | null) => void
  reset: () => void
}

const basePrices = {
  economy: 150,
  comfort: 250,
  business: 400,
}

export const useRideStore = create<RideState>()(
  persist(
    (set, get) => ({
      fromAddress: '',
      toAddress: '',
      fromCoords: null,
      toCoords: null,
      carClass: 'economy',
      childSeat: false,
      luggage: false,
      price: 0,
      duration: 0,
      distance: 0,
      orderStatus: null,
      driver: null,
      rating: null,
      mapClickMode: null,
      centerMapOnCoords: null,
      
      setFromAddress: (address) => set({ fromAddress: address }),
      setToAddress: (address) => set({ toAddress: address }),
      setFromCoords: (coords) => {
        set({ fromCoords: coords })
        const state = get()
        if (coords && state.toCoords) {
          // Пересчитываем цену с новыми координатами
          setTimeout(() => state.calculatePrice(), 100)
        }
      },
      setToCoords: (coords) => {
        set({ toCoords: coords })
        const state = get()
        if (coords && state.fromCoords) {
          // Пересчитываем цену с новыми координатами
          setTimeout(() => state.calculatePrice(), 100)
        }
      },
      setCarClass: (carClass) => {
        set({ carClass })
        const state = get()
        if (state.fromCoords && state.toCoords && state.distance > 0) {
          // Пересчитываем цену с новым классом, используя уже известное расстояние
          state.calculatePrice(state.distance, state.duration)
        } else if (state.fromAddress && state.toAddress) {
          // Если есть адреса, но нет координат, пересчитываем через API
          state.calculatePrice()
        } else {
          // Если нет маршрута, пересчитываем базовую цену с опциями
          const basePrice = basePrices[carClass]
          let price = basePrice
          if (state.childSeat) price += 50
          if (state.luggage) price += 30
          set({ price: Math.round(price) })
        }
      },
      setChildSeat: (value) => {
        set({ childSeat: value })
        const state = get()
        // Пересчитываем цену при изменении опций
        if (state.fromCoords && state.toCoords && state.distance > 0) {
          // Используем уже известное расстояние
          state.calculatePrice(state.distance, state.duration)
        } else if (state.fromAddress && state.toAddress) {
          // Если есть адреса, но нет координат, пересчитываем через API
          state.calculatePrice()
        } else {
          // Если нет маршрута, пересчитываем базовую цену
          const basePrice = basePrices[state.carClass]
          let price = basePrice
          if (value) price += 50
          if (state.luggage) price += 30
          set({ price: Math.round(price) })
        }
      },
      setLuggage: (value) => {
        set({ luggage: value })
        const state = get()
        // Пересчитываем цену при изменении опций
        if (state.fromCoords && state.toCoords && state.distance > 0) {
          // Используем уже известное расстояние
          state.calculatePrice(state.distance, state.duration)
        } else if (state.fromAddress && state.toAddress) {
          // Если есть адреса, но нет координат, пересчитываем через API
          state.calculatePrice()
        } else {
          // Если нет маршрута, пересчитываем базовую цену
          const basePrice = basePrices[state.carClass]
          let price = basePrice
          if (state.childSeat) price += 50
          if (value) price += 30
          set({ price: Math.round(price) })
        }
      },
      
      calculatePrice: (distanceParam?: number, durationParam?: number) => {
        const { fromAddress, toAddress, carClass, childSeat, luggage, fromCoords, toCoords } = get()
        
        if (!fromAddress || !toAddress) {
          set({ price: 0, duration: 0, distance: 0 })
          return
        }
        
        // Если переданы реальные данные из API
        if (distanceParam !== undefined && durationParam !== undefined) {
          const basePrice = basePrices[carClass]
          const distanceMultiplier = carClass === 'economy' ? 25 : carClass === 'comfort' ? 35 : 50
          let price = basePrice + (distanceParam * distanceMultiplier)
          
          // Дополнительные опции
          if (childSeat) price += 50
          if (luggage) price += 30
          
          set({ 
            price: Math.round(price),
            duration: Math.round(durationParam),
            distance: Math.round(distanceParam * 10) / 10
          })
          return
        }
        
        // Если есть координаты, получаем маршрут из API
        if (fromCoords && toCoords) {
          fetch(`https://router.project-osrm.org/route/v1/driving/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=false`)
            .then(res => res.json())
            .then(data => {
              if (data.code === 'Ok' && data.routes && data.routes[0]) {
                const route = data.routes[0]
                const distanceKm = route.distance / 1000 // в км
                const durationMin = route.duration / 60 // в минутах
                
                const basePrice = basePrices[carClass]
                const distanceMultiplier = carClass === 'economy' ? 25 : carClass === 'comfort' ? 35 : 50
                let price = basePrice + (distanceKm * distanceMultiplier)
                
                // Дополнительные опции
                if (childSeat) price += 50
                if (luggage) price += 30
                
                set({ 
                  price: Math.round(price),
                  duration: Math.round(durationMin),
                  distance: Math.round(distanceKm * 10) / 10
                })
              }
            })
            .catch(() => {
              // Fallback на симуляцию если API недоступен
              const baseDistance = 5 + Math.random() * 10
              const basePrice = basePrices[carClass]
              const distanceMultiplier = carClass === 'economy' ? 25 : carClass === 'comfort' ? 35 : 50
              let price = basePrice + (baseDistance * distanceMultiplier)
              
              if (childSeat) price += 50
              if (luggage) price += 30
              
              const speedMultiplier = carClass === 'economy' ? 2.5 : carClass === 'comfort' ? 2.2 : 2.0
              const calculatedDuration = Math.round(baseDistance * speedMultiplier)
              
              set({ 
                price: Math.round(price),
                duration: calculatedDuration,
                distance: Math.round(baseDistance * 10) / 10
              })
            })
          return
        }
        
        // Fallback на симуляцию
        const baseDistance = 5 + Math.random() * 10
        const basePrice = basePrices[carClass]
        const distanceMultiplier = carClass === 'economy' ? 25 : carClass === 'comfort' ? 35 : 50
        let price = basePrice + (baseDistance * distanceMultiplier)
        
        if (childSeat) price += 50
        if (luggage) price += 30
        
        const speedMultiplier = carClass === 'economy' ? 2.5 : carClass === 'comfort' ? 2.2 : 2.0
        const calculatedDuration = Math.round(baseDistance * speedMultiplier)
        
        set({ 
          price: Math.round(price),
          duration: calculatedDuration,
          distance: Math.round(baseDistance * 10) / 10
        })
      },
      
      setOrderStatus: (status) => set({ orderStatus: status }),
      setDriver: (driver) => set({ driver }),
      setRating: (rating) => set({ rating }),
      setMapClickMode: (mode) => set({ mapClickMode: mode }),
      setCenterMapOnCoords: (fn) => set({ centerMapOnCoords: fn }),
      
      reset: () => set({
        fromAddress: '',
        toAddress: '',
        fromCoords: null,
        toCoords: null,
        carClass: 'economy',
        childSeat: false,
        luggage: false,
        price: 0,
        duration: 0,
        distance: 0,
        orderStatus: null,
        driver: null,
        rating: null,
        mapClickMode: null,
        centerMapOnCoords: null,
      }),
    }),
    {
      name: 'ride-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

