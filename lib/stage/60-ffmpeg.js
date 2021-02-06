const child = require('child_process')
const path = require('path')
const config = require('config')

const fse = require('fs-extra')

const DEBUG = false
// const DEBUG = true

module.exports = (FFMPEG, input, output) => {
  if (FFMPEG == null) throw Error('no ffmpeg path provided')
  let options = {}
  if (!DEBUG) options = { stdio: 'ignore' }

  // console.log(path.dirname(output))
  fse.ensureDirSync(path.dirname(output))

  input = input.split('\\').join('/')
  output = output.split('\\').join('/')

  if (DEBUG) console.log('ffmpeg', input, output)
  return new Promise((res, rej) => {
    if (DEBUG) console.log('ffmpeg launch')
    const c = child.spawn(
      FFMPEG,
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

    if (DEBUG) c.stdout.on('data', (e) => console.log('' + e))
    if (DEBUG) c.stderr.on('data', (e) => console.log('' + e))

    c.on('exit', (code) => {
      if (DEBUG) console.log('ffmpeg', code)
      if (code !== 0) return rej('ffmpeg exit code ' + code)
      return res()
    })
  })
}
