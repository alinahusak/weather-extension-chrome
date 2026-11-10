import { OpenWeatherData, OpenWeatherTempScale } from './api'

export enum Messages {
  TOGGLE_OVERLAY = 'TOGGLE_OVERLAY',
  FETCH_WEATHER = 'FETCH_WEATHER',
}

export interface ToggleOverlayMessage {
  type: Messages.TOGGLE_OVERLAY
}

export interface FetchWeatherMessage {
  type: Messages.FETCH_WEATHER
  city: string
  tempScale: OpenWeatherTempScale
}

export type ExtensionMessage = ToggleOverlayMessage | FetchWeatherMessage

export type FetchWeatherResponse =
  | { ok: true; data: OpenWeatherData }
  | { ok: false; error: string }

/**
 * Запрос погоды через service worker. Нужен content script:
 * запросы со страницы сайта блокируются его CSP (connect-src).
 */
export function requestWeatherFromBackground(
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> {
  const msg: FetchWeatherMessage = {
    type: Messages.FETCH_WEATHER,
    city,
    tempScale,
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res?: FetchWeatherResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!res) {
        reject(new Error('No response from background'))
        return
      }
      if (res.ok) {
        resolve(res.data)
      } else {
        reject(new Error(res.error))
      }
    })
  })
}
