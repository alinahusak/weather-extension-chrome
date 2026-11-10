# Weather Extension

A Chrome extension (Manifest V3) built with React and Material UI. It shows the current weather for the cities you choose, using data from [OpenWeather](https://openweathermap.org/).

## Features

- **Popup** — a list of cities with weather cards: add a city (with the "+" button or Enter), delete it, and switch between °C and °F.
- **Home city** — set on the options page. Its temperature is shown as a badge on the extension icon. The badge updates every hour, and right away when you change the home city or the temperature scale.
- **Context menu** — select a city name on any page, right-click, and choose "Add city to weather extension".
- **Overlay** — a weather card for the home city shown on top of the page. Turn it on with the button in the popup, or have it appear automatically when a page loads (set this on the options page). It renders inside a Shadow DOM, so its styles and the page's styles don't affect each other.

## Permissions

The extension doesn't ask for access to your websites at install time.

- **`activeTab` + `scripting`** — when you click the overlay button in the popup, the overlay is injected into the current tab only.
- **Access to all websites** (`optional_host_permissions`) — needed only for showing the overlay automatically on page load. Chrome asks for it when you turn that option on and click Save. If you turn the option off, the extension gives the access back. If you revoke it in Chrome's settings, the option turns off by itself.
- **`storage`, `alarms`, `contextMenus`** — saved cities and settings, hourly badge updates, the context menu item.

## Requirements

- Node.js 18 or later
- Google Chrome (or another Chromium-based browser)
- A free OpenWeather API key

## OpenWeather API key

1. Sign up at https://home.openweathermap.org/users/sign_up and confirm your email.
2. Copy your key from the [API keys](https://home.openweathermap.org/api_keys) tab. A new key can take up to a couple of hours to activate.
3. Create a `.env` file in the project root (`.env.example` is a template):

   ```
   OPEN_WEATHER_API_KEY=your_key
   ```

   You can also set the `OPEN_WEATHER_API_KEY` environment variable instead of creating the file.

The key is inserted into the code at build time. `.env` is listed in `.gitignore`, so don't commit it. Anyone who unpacks the built extension can see the key. If you publish to the Chrome Web Store, send requests through your own server instead.

Without a key the extension still builds and runs, but the cards show `OpenWeather API key is not configured` instead of the weather.

## Install and build

```bash
npm ci
npm run build
```

The built extension goes to the `dist` folder.

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run build`     | Production build into `dist`                 |
| `npm start`         | Development build that rebuilds on changes   |
| `npm run typecheck` | TypeScript type check (strict)               |

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on "Developer mode" (the toggle in the top-right corner).
3. Click "Load unpacked" and select the `dist` folder.

After each rebuild, click ⟳ on the extension's card. The overlay doesn't work on browser pages (`chrome://`, the Chrome Web Store).

For service worker logs, click the "Service worker" link on the extension's card in `chrome://extensions`.

## Project structure

```
src/
├── background/background.ts         # service worker: install, context menu, badge, weather requests for the overlay
├── contentScript/contentScript.tsx  # in-page overlay (Shadow DOM), injected on demand
├── popup/                           # popup with the city list
├── options/                         # options page
├── components/WeatherCard/          # weather card
├── utils/
│   ├── api.ts                       # OpenWeather requests
│   ├── storage.ts                   # chrome.storage.local helpers
│   ├── overlay.ts                   # overlay injection and optional all-sites permission
│   └── messages.ts                  # messages between extension parts
├── static/                          # manifest.json and icon (copied to dist as is)
└── global.d.ts                      # type of the OPEN_WEATHER_API_KEY constant
```

The overlay gets the weather through the service worker instead of fetching it from the page, because a site's Content Security Policy would block those requests.

## Tech stack

React 17, Material UI 4, TypeScript, webpack 5.
