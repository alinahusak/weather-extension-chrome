import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { create } from 'jss'
import { Card } from '@material-ui/core'
import { jssPreset, makeStyles, StylesProvider } from '@material-ui/core/styles'
import WeatherCard from '../components/WeatherCard'
import {
  getStoredOptions,
  LocalStorageKeys,
  LocalStorageOptions,
} from '../utils/storage'
import {
  ExtensionMessage,
  Messages,
  requestWeatherFromBackground,
} from '../utils/messages'

const OPTIONS_KEY: LocalStorageKeys = 'options'

const useStyles = makeStyles({
  overlayCard: {
    position: 'fixed',
    left: '5%',
    top: '15%',
    maxWidth: 240,
    maxHeight: 240,
    backgroundColor: '#f5f5f5',
    zIndex: 2147483647,
  },
})

const App: React.FC<{}> = () => {
  const classes = useStyles()
  const [options, setOptions] = useState<LocalStorageOptions | null>(null)
  // скрипт внедряется либо по кнопке в popup, либо автоматически (если включён автопоказ),
  // в обоих случаях оверлей нужно сразу показать
  const [isActive, setIsActive] = useState<boolean>(true)

  useEffect(() => {
    getStoredOptions().then(setOptions)
  }, [])

  useEffect(() => {
    const handleMessage = (msg: ExtensionMessage) => {
      if (msg?.type === Messages.TOGGLE_OVERLAY) {
        setIsActive((prev) => !prev)
      }
    }
    // подхватываем новые настройки без перезагрузки страницы
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes[OPTIONS_KEY]) {
        getStoredOptions().then(setOptions)
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  if (!options || !isActive || options.homeCity === '') {
    return null
  }

  return (
    <Card className={classes.overlayCard}>
      <WeatherCard
        city={options.homeCity}
        tempScale={options.tempScale}
        fetchWeather={requestWeatherFromBackground}
        onDelete={() => setIsActive(false)}
      />
    </Card>
  )
}

const HOST_ID = 'weather-extension-root'

// Рендерим в Shadow DOM: стили MUI не протекают на страницу, а стили страницы — в оверлей
function mount() {
  const host = document.createElement('div')
  host.id = HOST_ID
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })

  const stylesInsertionPoint = document.createElement('div')
  const appContainer = document.createElement('div')
  shadowRoot.appendChild(stylesInsertionPoint)
  shadowRoot.appendChild(appContainer)

  const jss = create({
    ...jssPreset(),
    insertionPoint: stylesInsertionPoint,
  })

  ReactDOM.render(
    <StylesProvider jss={jss}>
      <App />
    </StylesProvider>,
    appContainer
  )
}

// Popup внедряет скрипт, только если во вкладке нет живого content script. Если оверлей уже
// есть в DOM, он остался от старой версии расширения (после обновления/перезагрузки) и больше
// не связан с ним — заменяем его.
document.getElementById(HOST_ID)?.remove()
mount()
