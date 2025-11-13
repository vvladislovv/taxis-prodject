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
                  text: `ул. Тестовая, ${Math.floor(lat * 100) % 100}`,
                  Address: {
                    Street: 'Тестовая',
                    House: `${Math.floor(lat * 100) % 100}`,
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
  
  // Дефолтный ответ
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
                text: 'Москва, центр',
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

