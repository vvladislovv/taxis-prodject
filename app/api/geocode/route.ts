import { NextRequest, NextResponse } from 'next/server'

// Тестовые данные для демо
const testGeocodeData: { [key: string]: { lat: number; lon: number; address: string } } = {
  'красная площадь': { lat: 55.7539, lon: 37.6208, address: 'Красная площадь, 1' },
  'тверская': { lat: 55.7558, lon: 37.6173, address: 'Тверская улица, 10' },
  'арбат': { lat: 55.7520, lon: 37.5914, address: 'Арбат, 25' },
  'ленинский проспект': { lat: 55.7000, lon: 37.5500, address: 'Ленинский проспект, 50' },
  'кутузовский проспект': { lat: 55.7400, lon: 37.5300, address: 'Кутузовский проспект, 15' },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Используем тестовые данные для демо
  const queryLower = query.toLowerCase()
  
  // Проверяем, является ли запрос координатами
  const coordMatch = query.match(/(\d+\.\d+)[,\s]+(\d+\.\d+)/)
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1])
    const lon = parseFloat(coordMatch[2])
    
    // Генерируем более реалистичные адреса на основе координат
    const streetNames = [
      'Ленина', 'Мира', 'Советская', 'Центральная', 'Победы', 
      'Тверская', 'Арбат', 'Красная площадь', 'Садовое кольцо',
      'Ленинский проспект', 'Кутузовский проспект', 'Проспект Мира'
    ]
    const streetIndex = Math.floor((Math.abs(lat) * 100) % streetNames.length)
    const houseNumber = Math.floor((Math.abs(lon) * 100) % 200) + 1
    
    return NextResponse.json({
      response: {
        GeoObjectCollection: {
          featureMember: [{
            GeoObject: {
              Point: {
                pos: `${lon} ${lat}`
              },
              metaDataProperty: {
                GeocoderMetaData: {
                  text: `ул. ${streetNames[streetIndex]}, д. ${houseNumber}`,
                  Address: {
                    Street: `ул. ${streetNames[streetIndex]}`,
                    House: `${houseNumber}`,
                    Locality: 'Москва'
                  }
                }
              }
            }
          }]
        }
      }
    })
  }
  
  // Ищем в тестовых данных
  for (const [key, data] of Object.entries(testGeocodeData)) {
    if (queryLower.includes(key)) {
      return NextResponse.json({
        response: {
          GeoObjectCollection: {
            featureMember: [{
              GeoObject: {
                Point: {
                  pos: `${data.lon} ${data.lat}`
                },
                metaDataProperty: {
                  GeocoderMetaData: {
                    text: data.address,
                    Address: {
                      Street: data.address.split(',')[0],
                      Locality: 'Москва'
                    }
                  }
                }
              }
            }]
          }
        }
      })
    }
  }
  
  // Расширенный список адресов для более точного геокодирования
  const extendedAddresses: { [key: string]: { lat: number; lon: number; address: string } } = {
    'люберцы': { lat: 55.6783, lon: 37.8933, address: 'Люберцы' },
    'тверская': { lat: 55.7558, lon: 37.6173, address: 'ул. Тверская' },
    'тверская 168': { lat: 55.7558, lon: 37.6173, address: 'ул. Тверская, д. 168' },
    'тверская д. 168': { lat: 55.7558, lon: 37.6173, address: 'ул. Тверская, д. 168' },
    'тверская д 168': { lat: 55.7558, lon: 37.6173, address: 'ул. Тверская, д. 168' },
    'москва': { lat: 55.7558, lon: 37.6173, address: 'Москва' },
    'красная площадь': { lat: 55.7539, lon: 37.6208, address: 'Красная площадь' },
    'арбат': { lat: 55.7520, lon: 37.5914, address: 'Арбат' },
    'ленинский': { lat: 55.7000, lon: 37.5500, address: 'Ленинский проспект' },
    'кутузовский': { lat: 55.7400, lon: 37.5300, address: 'Кутузовский проспект' },
    'садовое': { lat: 55.7500, lon: 37.6000, address: 'Садовое кольцо' },
    'вднх': { lat: 55.8300, lon: 37.6300, address: 'ВДНХ' },
    'парк горького': { lat: 55.7320, lon: 37.6010, address: 'Парк Горького' },
    'сокольники': { lat: 55.7900, lon: 37.6800, address: 'Сокольники' },
    'измайловский': { lat: 55.7900, lon: 37.7500, address: 'Измайловский парк' },
  }
  
  // Ищем в расширенном списке
  for (const [key, data] of Object.entries(extendedAddresses)) {
    if (queryLower.includes(key)) {
      // Если есть номер дома в запросе, пытаемся его извлечь
      const houseMatch = query.match(/(?:д\.?|дом|д)\s*(\d+)/i)
      const houseNumber = houseMatch ? houseMatch[1] : null
      
      let address = data.address
      if (houseNumber && !address.includes(houseNumber)) {
        address = `${data.address}, д. ${houseNumber}`
      }
      
      return NextResponse.json({
        response: {
          GeoObjectCollection: {
            featureMember: [{
              GeoObject: {
                Point: {
                  pos: `${data.lon} ${data.lat}`
                },
                metaDataProperty: {
                  GeocoderMetaData: {
                    text: address,
                    Address: {
                      Street: address.split(',')[0],
                      House: houseNumber || undefined,
                      Locality: 'Москва'
                    }
                  }
                }
              }
            }]
          }
        }
      })
    }
  }
  
  // Если адрес содержит "ул." или "улица", пытаемся найти координаты
  const streetMatch = query.match(/(?:ул\.?|улица|проспект|пр\.?|проезд|пер\.?|переулок)\s+([^,]+)/i)
  if (streetMatch) {
    const streetName = streetMatch[1].trim().toLowerCase()
    const houseMatch = query.match(/(?:д\.?|дом|д)\s*(\d+)/i)
    const houseNumber = houseMatch ? houseMatch[1] : null
    
    // Генерируем координаты на основе названия улицы (хеш для консистентности)
    let hash = 0
    for (let i = 0; i < streetName.length; i++) {
      hash = ((hash << 5) - hash) + streetName.charCodeAt(i)
      hash = hash & hash
    }
    
    // Генерируем координаты в пределах Москвы
    const lat = 55.7 + (Math.abs(hash) % 100) / 1000
    const lon = 37.5 + (Math.abs(hash) % 100) / 1000
    
    let address = `ул. ${streetName.charAt(0).toUpperCase() + streetName.slice(1)}`
    if (houseNumber) {
      address += `, д. ${houseNumber}`
    }
    
    return NextResponse.json({
      response: {
        GeoObjectCollection: {
          featureMember: [{
            GeoObject: {
              Point: {
                pos: `${lon} ${lat}`
              },
              metaDataProperty: {
                GeocoderMetaData: {
                  text: address,
                  Address: {
                    Street: `ул. ${streetName.charAt(0).toUpperCase() + streetName.slice(1)}`,
                    House: houseNumber || undefined,
                    Locality: 'Москва'
                  }
                }
              }
            }
          }]
        }
      }
    })
  }
  
  // Дефолтный ответ - центр Москвы
  return NextResponse.json({
    response: {
      GeoObjectCollection: {
        featureMember: [{
          GeoObject: {
            Point: {
              pos: '37.6173 55.7558'
            },
            metaDataProperty: {
              GeocoderMetaData: {
                text: query || 'Москва, центр',
                Address: {
                  Locality: 'Москва'
                }
              }
            }
          }
        }]
      }
    }
  })
}

