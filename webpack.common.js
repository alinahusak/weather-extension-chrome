const fs = require('fs')
const path = require('path')
const { DefinePlugin } = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

// Ключ OpenWeather берётся из переменной окружения или из файла .env (не коммитится)
function readApiKey() {
  if (process.env.OPEN_WEATHER_API_KEY) {
    return process.env.OPEN_WEATHER_API_KEY
  }
  const envPath = path.resolve('.env')
  if (fs.existsSync(envPath)) {
    const match = fs
      .readFileSync(envPath, 'utf8')
      .match(/^\s*OPEN_WEATHER_API_KEY\s*=\s*(.*?)\s*$/m)
    if (match && match[1]) {
      return match[1].replace(/^['"]|['"]$/g, '')
    }
  }
  console.warn(
    '[weather-extension] OPEN_WEATHER_API_KEY is not set, weather requests will fail'
  )
  return ''
}

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.tsx'),
    options: path.resolve('src/options/options.tsx'),
    background: path.resolve('src/background/background.ts'),
    contentScript: path.resolve('src/contentScript/contentScript.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new DefinePlugin({
      OPEN_WEATHER_API_KEY: JSON.stringify(readApiKey()),
    }),
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('dist'),
        },
      ],
    }),
    ...getHtmlPlugins(['popup', 'options']),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
  },
  optimization: {
    splitChunks: {
      // service worker и content script должны быть самодостаточными файлами
      chunks(chunk) {
        return chunk.name !== 'contentScript' && chunk.name !== 'background'
      },
    },
  },
}

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: 'Weather Extension',
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  )
}
