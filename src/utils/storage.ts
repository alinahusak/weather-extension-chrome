import { OpenWeatherTempScale } from './api'

export interface LocalStorage {
  cities?: string[]
  options?: LocalStorageOptions
}

export interface LocalStorageOptions {
  hasAutoOverlay: boolean
  homeCity: string
  tempScale: OpenWeatherTempScale
}

export type LocalStorageKeys = keyof LocalStorage

export const DEFAULT_OPTIONS: LocalStorageOptions = {
  hasAutoOverlay: false,
  homeCity: '',
  tempScale: 'metric',
}

export function normalizeCityName(city: string): string {
  return city.trim().replace(/\s+/g, ' ')
}

/** Добавляет город, если его ещё нет в списке (без учёта регистра). */
export function addCityToList(cities: string[], city: string): string[] {
  const normalized = normalizeCityName(city)
  if (
    normalized === '' ||
    cities.some((c) => c.toLowerCase() === normalized.toLowerCase())
  ) {
    return cities
  }
  return [...cities, normalized]
}

export function setStoredCities(cities: string[]): Promise<void> {
  const vals: LocalStorage = {
    cities,
  }
  return new Promise((resolve) => {
    chrome.storage.local.set(vals, () => {
      resolve()
    })
  })
}

export function getStoredCities(): Promise<string[]> {
  const keys: LocalStorageKeys[] = ['cities']
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (res: LocalStorage) => {
      resolve(res.cities ?? [])
    })
  })
}

export function setStoredOptions(options: LocalStorageOptions): Promise<void> {
  const vals: LocalStorage = {
    options,
  }
  return new Promise((resolve) => {
    chrome.storage.local.set(vals, () => {
      resolve()
    })
  })
}

export function getStoredOptions(): Promise<LocalStorageOptions> {
  const keys: LocalStorageKeys[] = ['options']
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (res: LocalStorage) => {
      // если настроек ещё нет (или в них не хватает полей) — подставляем дефолты
      resolve({ ...DEFAULT_OPTIONS, ...res.options })
    })
  })
}
