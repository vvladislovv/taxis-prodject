import { NextRequest, NextResponse } from 'next/server'

// Тестовые данные для демо
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text')
  
  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
  }

  // Используем тестовые данные для демо
  const textLower = text.toLowerCase()
  
  // Фильтруем адреса по запросу
  const filtered = testAddresses
    .filter(addr => addr.toLowerCase().includes(textLower))
    .slice(0, 5)
    .map(addr => ({
      title: { text: addr },
      subtitle: { text: 'Москва' }
    }))
  
  return NextResponse.json({ results: filtered })
}

