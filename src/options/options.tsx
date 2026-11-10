import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  TextField,
  Typography,
} from '@material-ui/core'
import '@fontsource/roboto'
import './options.css'
import {
  getStoredOptions,
  LocalStorageOptions,
  normalizeCityName,
  setStoredOptions,
} from '../utils/storage'
import {
  removeAllSitesPermission,
  requestAllSitesPermission,
} from '../utils/overlay'

type FormState = 'ready' | 'saving'

const App: React.FC<{}> = () => {
  const [options, setOptions] = useState<LocalStorageOptions | null>(null)
  const [formState, setFormState] = useState<FormState>('ready')
  const [permissionError, setPermissionError] = useState<string>('')

  useEffect(() => {
    getStoredOptions().then((options) => setOptions(options))
  }, [])

  const handleHomeCityChange = (homeCity: string) => {
    setOptions((prev) => (prev ? { ...prev, homeCity } : prev))
  }

  const handleAutoOverlayChange = (hasAutoOverlay: boolean) => {
    setOptions((prev) => (prev ? { ...prev, hasAutoOverlay } : prev))
  }

  const handleSaveButtonClick = async () => {
    if (!options) {
      return
    }
    setPermissionError('')
    // запрос разрешения должен идти сразу из обработчика клика, до других await
    const permissionResult = options.hasAutoOverlay
      ? requestAllSitesPermission()
      : removeAllSitesPermission().then(() => false)
    const hasPermission = await permissionResult

    const normalized: LocalStorageOptions = {
      ...options,
      homeCity: normalizeCityName(options.homeCity),
      hasAutoOverlay: options.hasAutoOverlay && hasPermission,
    }
    if (options.hasAutoOverlay && !hasPermission) {
      setPermissionError(
        'Auto overlay needs access to all websites. It stays off until you allow it.'
      )
    }
    setFormState('saving')
    // background сам зарегистрирует/снимет content script по изменению настроек
    await setStoredOptions(normalized)
    setOptions(normalized)
    setTimeout(() => {
      setFormState('ready')
    }, 1000)
  }

  if (!options) {
    return null
  }

  const isFieldsDisabled = formState === 'saving'

  return (
    <Box mx="10%" my="2%">
      <Card>
        <CardContent>
          <Grid container direction="column" spacing={4}>
            <Grid item>
              <Typography variant="h4">Weather Extension Options</Typography>
            </Grid>
            <Grid item>
              <Typography variant="body1">Home city name</Typography>
              <TextField
                fullWidth
                placeholder="Enter a home city name"
                value={options.homeCity}
                onChange={(event) => handleHomeCityChange(event.target.value)}
                disabled={isFieldsDisabled}
              />
            </Grid>
            <Grid item>
              <Typography variant="body1">
                Auto toggle overlay on webpage load
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Requires access to all websites. Chrome will ask for it when you
                save.
              </Typography>
              <Switch
                color="primary"
                checked={options.hasAutoOverlay}
                onChange={(_event, checked) => handleAutoOverlayChange(checked)}
                disabled={isFieldsDisabled}
              />
              {permissionError !== '' && (
                <Typography variant="body2" color="error">
                  {permissionError}
                </Typography>
              )}
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveButtonClick}
                disabled={isFieldsDisabled}
              >
                {formState === 'ready' ? 'Save' : 'Saving...'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App />, root)
