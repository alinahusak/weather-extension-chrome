import {
  addCityToList,
  DEFAULT_OPTIONS,
  getStoredCities,
  getStoredOptions,
  LocalStorageKeys,
  setStoredCities,
  setStoredOptions,
} from '../utils/storage'
import { fetchOpenWeatherData, getTempScaleSymbol } from '../utils/api'
import { syncAutoOverlayScript } from '../utils/overlay'
import {
  ExtensionMessage,
  FetchWeatherResponse,
  Messages,
} from '../utils/messages'

const CONTEXT_MENU_ID = 'weatherExtension'
const BADGE_ALARM = 'updateBadge'
const OPTIONS_KEY: LocalStorageKeys = 'options'

chrome.runtime.onInstalled.addListener((details) => {
  // при обновлении расширения данные пользователя не трогаем
  if (details.reason === 'install') {
    setStoredCities([])
    setStoredOptions(DEFAULT_OPTIONS)
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      contexts: ['selection'],
      title: 'Add city to weather extension',
      id: CONTEXT_MENU_ID,
    })
  })

  chrome.alarms.create(BADGE_ALARM, {
    periodInMinutes: 60,
  })
  updateBadge()
  syncAutoOverlay()
})

chrome.runtime.onStartup.addListener(() => {
  updateBadge()
  syncAutoOverlay()
})

// пользователь может выдать или отозвать доступ ко всем сайтам в настройках Chrome
chrome.permissions.onAdded.addListener(() => {
  syncAutoOverlay()
})

chrome.permissions.onRemoved.addListener(() => {
  syncAutoOverlay()
})

chrome.contextMenus.onClicked.addListener((info) => {
  const selection = info.selectionText
  if (info.menuItemId !== CONTEXT_MENU_ID || !selection) {
    return
  }
  getStoredCities().then((cities) => {
    const updated = addCityToList(cities, selection)
    if (updated !== cities) {
      return setStoredCities(updated)
    }
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BADGE_ALARM) {
    updateBadge()
  }
})

// при смене настроек сразу обновляем бейдж и регистрацию автооверлея
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[OPTIONS_KEY]) {
    updateBadge()
    syncAutoOverlay()
  }
})

function syncAutoOverlay(): void {
  syncAutoOverlayScript().catch((err) =>
    console.error('Failed to sync auto overlay content script', err)
  )
}

// content script получает погоду через service worker (обход CSP страницы)
chrome.runtime.onMessage.addListener(
  (msg: ExtensionMessage, _sender, sendResponse) => {
    if (msg?.type !== Messages.FETCH_WEATHER) {
      return false
    }
    fetchOpenWeatherData(msg.city, msg.tempScale)
      .then((data) => {
        const res: FetchWeatherResponse = { ok: true, data }
        sendResponse(res)
      })
      .catch((err: unknown) => {
        const res: FetchWeatherResponse = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }
        sendResponse(res)
      })
    // ответ асинхронный — канал должен остаться открытым
    return true
  }
)

function setBadgeText(text: string): Promise<void> {
  return new Promise((resolve) => chrome.action.setBadgeText({ text }, resolve))
}

async function updateBadge(): Promise<void> {
  const options = await getStoredOptions()
  if (options.homeCity === '') {
    await setBadgeText('')
    return
  }
  try {
    const data = await fetchOpenWeatherData(options.homeCity, options.tempScale)
    const temp = Math.round(data.main.temp)
    await setBadgeText(`${temp}${getTempScaleSymbol(options.tempScale)}`)
  } catch (err) {
    console.error('Failed to update weather badge', err)
    await setBadgeText('')
  }
}
