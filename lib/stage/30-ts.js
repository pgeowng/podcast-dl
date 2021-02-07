const path = require('path')
const urllib = require('url')
const URL = require('url').URL
const { download } = require('../common')

const options = {
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
}

module.exports = async (url, dest) => {
  console.log('ts')
  let keys = [],
    audio = []
  await download(url, dest, options, (file) => {
    let index = 0

    file = file.replace(
      /(#EXT-X-KEY:METHOD=AES-128,URI=")([^"]*)([^\n]*)/g,
      (_, p1, p2, p3) => {
        // console.log('key', p1, p2, p3)
        const name = index++ + '.key'
        keys.push({ url: p2, dest: name })
        return [p1, name, p3].join('')
      }
    )

    file = file.replace(/(.*)\n/g, (_, p1) => {
      if (p1[0] == '#') return p1 + '\n'
      // console.log('audio', p1)

      const name = index++ + '.ts'

      audio.push({
        url: '' + new URL(p1, url),
        dest: name,
      })

      return name + '\n'
    })

    return file
  })

  return { keys, audio }
}
