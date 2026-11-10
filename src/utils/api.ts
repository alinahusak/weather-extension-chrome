export interface OpenWeatherData {
  name: string
  main: {
    feels_like: number
    humidity: number
    pressure: number
    temp: number
    temp_max: number
    temp_min: number
  }
  weather: {
    description: string
    icon: string
    id: number
    main: string
  }[]
  wind: {
    deg: number
    speed: number
  }
}

export type OpenWeatherTempScale = 'metric' | 'imperial'

export function getTempScaleSymbol(tempScale: OpenWeatherTempScale): string {
  return tempScale === 'metric' ? '℃' : '℉'
}

export async function fetchOpenWeatherData(
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> {
  if (!OPEN_WEATHER_API_KEY) {
    throw new Error('OpenWeather API key is not configured')
  }

  const params = new URLSearchParams({
    q: city,
    units: tempScale,
    appid: OPEN_WEATHER_API_KEY,
  })
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
  )

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('City not found')
    }
    if (res.status === 401) {
      throw new Error('Invalid OpenWeather API key')
    }
    throw new Error(`OpenWeather request failed (${res.status})`)
  }

  const data: OpenWeatherData = await res.json()
  return data
}

export function getWeatherIconSrc(iconCode: string) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}
