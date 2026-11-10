import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  Box,
  Grid,
  InputBase,
  IconButton,
  Paper,
  Typography,
} from '@material-ui/core'
import {
  Add as AddIcon,
  PictureInPicture as PictureInPictureIcon,
} from '@material-ui/icons'
import '@fontsource/roboto'
import './popup.css'
import WeatherCard from '../components/WeatherCard'
import {
  addCityToList,
  setStoredCities,
  setStoredOptions,
  getStoredCities,
  getStoredOptions,
  LocalStorageOptions,
} from '../utils/storage'
import { getTempScaleSymbol } from '../utils/api'
import { toggleOverlayInTab } from '../utils/overlay'

const App: React.FC<{}> = () => {
  const [cities, setCities] = useState<string[]>([])
  const [cityInput, setCityInput] = useState<string>('')
  const [options, setOptions] = useState<LocalStorageOptions | null>(null)
  const [overlayError, setOverlayError] = useState<string>('')

  useEffect(() => {
    getStoredCities().then((cities) => setCities(cities))
    getStoredOptions().then((options) => setOptions(options))
  }, [])

  const handleCityButtonClick = () => {
    const updatedCities = addCityToList(cities, cityInput)
    if (updatedCities === cities) {
      // пустой ввод или город уже есть в списке
      setCityInput('')
      return
    }
    setStoredCities(updatedCities).then(() => {
      setCities(updatedCities)
      setCityInput('')
    })
  }

  const handleCityDeleteButtonClick = (index: number) => {
    const updatedCities = cities.filter((_, i) => i !== index)
    setStoredCities(updatedCities).then(() => {
      setCities(updatedCities)
    })
  }

  const handleTempScaleButtonClick = () => {
    if (!options) {
      return
    }
    const updateOptions: LocalStorageOptions = {
      ...options,
      tempScale: options.tempScale === 'metric' ? 'imperial' : 'metric',
    }
    setStoredOptions(updateOptions).then(() => {
      setOptions(updateOptions)
    })
  }

  const handleOverlayButtonClick = async () => {
    setOverlayError('')
    if (!options || options.homeCity === '') {
      setOverlayError('Set a home city in the options first')
      return
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id === undefined) {
      return
    }
    try {
      await toggleOverlayInTab(tab.id)
    } catch (err) {
      // chrome://, Chrome Web Store и другие служебные страницы недоступны для скриптов
      console.error('Failed to show overlay', err)
      setOverlayError('Overlay is not available on this page')
    }
  }

  if (!options) {
    return null
  }

  return (
    <Box mx="8px" my="16px">
      <Grid container justify="space-evenly">
        <Grid item>
          <Paper>
            <Box px="15px" py="5px">
              <InputBase
                placeholder="Add a city name"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleCityButtonClick()
                  }
                }}
              />
              <IconButton onClick={handleCityButtonClick}>
                <AddIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
        <Grid item>
          <Paper>
            <Box py="4px">
              <IconButton onClick={handleTempScaleButtonClick}>
                {getTempScaleSymbol(options.tempScale)}
              </IconButton>
            </Box>
          </Paper>
        </Grid>
        <Grid item>
          <Paper>
            <Box py="4px">
              <IconButton onClick={handleOverlayButtonClick}>
                <PictureInPictureIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {overlayError !== '' && (
        <Box mt="8px">
          <Typography color="error" align="center">
            {overlayError}
          </Typography>
        </Box>
      )}
      {options.homeCity !== '' && (
        <WeatherCard city={options.homeCity} tempScale={options.tempScale} />
      )}
      {cities.map((city, index) => (
        <WeatherCard
          city={city}
          tempScale={options.tempScale}
          key={city}
          onDelete={() => handleCityDeleteButtonClick(index)}
        />
      ))}
      <Box height="16px" />
    </Box>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App />, root)
