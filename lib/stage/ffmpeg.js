const child = require('child_process')
const path = require('path')
const fse = require('fs-extra')
const {lookpath} = require('lookpath')
const log = require('../logger')

const DEBUG = false
const ffmpegBin = (async ()=>{
  const result = await lookpath('ffmpeg')
  if (!result) {
    log.error('ffmpeg.js', Error('ffmpeg was not found'), 'ffmpeg was not found in PATH' )
    process.exit(1)
  }
  return result
})()

module.exports = (input, output) => {
  let options = {}
  if (!DEBUG) options = { stdio: 'ignore' }

  // console.log(path.dirname(output))
  fse.ensureDirSync(path.dirname(output))

  input = input.split('\\').join('/')
  output = output.split('\\').join('/')

  if (DEBUG) console.log('ffmpeg', input, output)
  return new Promise(async (res, rej) => {
    if (DEBUG) console.log('ffmpeg launch')


    const c = child.spawn(
      await ffmpegBin,
      [
        '-allowed_extensions',
        'ALL',
        '-i',
        input,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-q:a',
        '2',
        '-y',
        output,
      ],
      options
    )

    let stdout = ''
    let stderr = ''
    if (DEBUG) c.stdout.on('data', (e) => stdout + e)
    if (DEBUG) c.stderr.on('data', (e) => stderr + e)


    c.on('exit', (code) => {
      if (DEBUG) console.log('ffmpeg', code)
      if (code !== 0) return rej('ffmpeg exit code ' + code)
      return res()
    })
  })
}
