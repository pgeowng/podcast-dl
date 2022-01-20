const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const config = dotenv.config()
const { lookpath } = require('lookpath')

if (config.error) {
  throw config.error
}

const result = config.parsed

;(async () => {
  ffmpeg = await lookpath('ffmpeg')
  if (ffmpeg == null) throw 'err'
  result.ffmpeg = ffmpeg
})()

module.exports = result
