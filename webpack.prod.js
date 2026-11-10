const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'production',
  // файлы расширения грузятся локально, лимиты размера для веба тут не актуальны
  performance: {
    hints: false,
  },
})
