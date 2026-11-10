import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import {
  getTempScaleSymbol,
  getWeatherIconSrc,
  fetchOpenWeatherData,
  OpenWeatherData,
  OpenWeatherTempScale,
} from '../../utils/api'

// стили через JSS (а не глобальный CSS), чтобы они работали и внутри Shadow DOM content script
const useStyles = makeStyles({
  title: {
    fontSize: 24,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
  },
  temp: {
    fontSize: 46,
    textAlign: 'center',
  },
})

export type WeatherFetcher = (
  city: string,
  tempScale: OpenWeatherTempScale
) => Promise<OpenWeatherData>

const WeatherCardContainer: React.FC<{
  children: React.ReactNode
  onDelete?: () => void
}> = ({ children, onDelete }) => {
  const classes = useStyles()
  return (
    <Box mx={'4px'} my={'16px'}>
      <Card>
        <CardContent>{children}</CardContent>
        {onDelete && (
          <CardActions>
            <Button color="secondary" onClick={onDelete}>
              <Typography className={classes.body}>Delete</Typography>
            </Button>
          </CardActions>
        )}
      </Card>
    </Box>
  )
}

type WeatherCardState = 'loading' | 'error' | 'ready'

const WeatherCard: React.FC<{
  city: string
  tempScale: OpenWeatherTempScale
  onDelete?: () => void
  fetchWeather?: WeatherFetcher
}> = ({ city, tempScale, onDelete, fetchWeather = fetchOpenWeatherData }) => {
  const classes = useStyles()
  const [weatherData, setWeatherData] = useState<OpenWeatherData | null>(null)
  const [cardState, setCardState] = useState<WeatherCardState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isIconVisible, setIsIconVisible] = useState<boolean>(true)

  useEffect(() => {
    // игнорируем ответ, если город/шкала сменились или карточка размонтирована
    let isCancelled = false
    setCardState('loading')
    setIsIconVisible(true)
    fetchWeather(city, tempScale)
      .then((data) => {
        if (isCancelled) return
        setWeatherData(data)
        setCardState('ready')
      })
      .catch((err: unknown) => {
        if (isCancelled) return
        setErrorMessage(err instanceof Error ? err.message : String(err))
        setCardState('error')
      })
    return () => {
      isCancelled = true
    }
  }, [city, tempScale, fetchWeather])

  if (cardState !== 'ready' || !weatherData) {
    return (
      <WeatherCardContainer onDelete={onDelete}>
        <Typography className={classes.title}>{city}</Typography>
        <Typography className={classes.body}>
          {cardState === 'loading'
            ? 'Loading...'
            : `Error: could not retrieve weather data for this city. ${errorMessage}`}
        </Typography>
      </WeatherCardContainer>
    )
  }

  const symbol = getTempScaleSymbol(tempScale)
  const condition = weatherData.weather[0]

  return (
    <WeatherCardContainer onDelete={onDelete}>
      <Grid container justify="space-around">
        <Grid item>
          <Typography className={classes.title}>{weatherData.name}</Typography>
          <Typography className={classes.temp}>
            {Math.round(weatherData.main.temp)}
            {symbol}
          </Typography>
          <Typography className={classes.body}>
            Feels like {Math.round(weatherData.main.feels_like)}
            {symbol}
          </Typography>
        </Grid>
        <Grid item>
          {condition && (
            <>
              {isIconVisible && (
                <img
                  src={getWeatherIconSrc(condition.icon)}
                  alt={condition.description}
                  // на сайтах со строгим CSP (img-src) иконка может не загрузиться
                  onError={() => setIsIconVisible(false)}
                />
              )}
              <Typography className={classes.body}>{condition.main}</Typography>
            </>
          )}
        </Grid>
      </Grid>
    </WeatherCardContainer>
  )
}

export default WeatherCard
