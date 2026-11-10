import { getStoredOptions, setStoredOptions } from './storage'
import { Messages, ToggleOverlayMessage } from './messages'

/** Имя собранного файла content script (см. entry в webpack.common.js). */
export const CONTENT_SCRIPT_FILE = 'contentScript.js'

const AUTO_OVERLAY_SCRIPT_ID = 'auto-overlay'

/**
 * Доступ ко всем сайтам нужен только для автопоказа оверлея при загрузке страницы.
 * Он объявлен в optional_host_permissions и запрашивается, когда пользователь включает эту опцию,
 * поэтому при установке Chrome не предупреждает о доступе ко всем данным на сайтах.
 */
export const ALL_SITES: chrome.permissions.Permissions = {
  origins: ['<all_urls>'],
}

export function hasAllSitesPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.contains(ALL_SITES, (result) => resolve(result))
  })
}

/** Должен вызываться синхронно из обработчика действия пользователя (клик). */
export function requestAllSitesPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.request(ALL_SITES, (granted) => {
      resolve(Boolean(granted) && !chrome.runtime.lastError)
    })
  })
}

export function removeAllSitesPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.remove(ALL_SITES, (removed) => resolve(Boolean(removed)))
  })
}

/**
 * Регистрирует content script на всех сайтах, если включён автопоказ оверлея и есть разрешение,
 * иначе снимает регистрацию.
 */
export async function syncAutoOverlayScript(): Promise<void> {
  const [options, hasPermission, registered] = await Promise.all([
    getStoredOptions(),
    hasAllSitesPermission(),
    chrome.scripting.getRegisteredContentScripts({
      ids: [AUTO_OVERLAY_SCRIPT_ID],
    }),
  ])
  const shouldBeRegistered = options.hasAutoOverlay && hasPermission
  const isRegistered = registered.length > 0

  // доступа нет (отозван в настройках Chrome или опция включена до появления
  // optional-разрешений) — выключаем опцию, чтобы страница настроек показывала правду
  if (options.hasAutoOverlay && !hasPermission) {
    await setStoredOptions({ ...options, hasAutoOverlay: false })
  }

  if (shouldBeRegistered && !isRegistered) {
    await chrome.scripting.registerContentScripts([
      {
        id: AUTO_OVERLAY_SCRIPT_ID,
        matches: ['<all_urls>'],
        js: [CONTENT_SCRIPT_FILE],
        runAt: 'document_idle',
        persistAcrossSessions: true,
      },
    ])
  } else if (!shouldBeRegistered && isRegistered) {
    await chrome.scripting.unregisterContentScripts({
      ids: [AUTO_OVERLAY_SCRIPT_ID],
    })
  }
}

function sendToggleOverlay(tabId: number): Promise<boolean> {
  const msg: ToggleOverlayMessage = { type: Messages.TOGGLE_OVERLAY }
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, msg, () => {
      // lastError = в этой вкладке content script ещё нет
      resolve(!chrome.runtime.lastError)
    })
  })
}

/**
 * Показывает/скрывает оверлей во вкладке. Если content script во вкладке ещё нет,
 * внедряет его (право на это даёт activeTab после клика по иконке расширения),
 * и он сразу показывает оверлей.
 */
export async function toggleOverlayInTab(tabId: number): Promise<void> {
  if (await sendToggleOverlay(tabId)) {
    return
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_FILE],
  })
}
