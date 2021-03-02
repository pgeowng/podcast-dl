const { URL } = require('url')
const { download, err } = require('../common')

const TSAUDIONAME = 'tsaudio.m3u8'

module.exports = async (url, dest, tsaudio) => {
  let tsaudioUrl, cookie

  await download(url, dest, null, (text, res) => {
    const lines = text.split('\n').filter((e) => e.length > 0)
    const links = lines.filter((e) => e[0] != '#')
    if (links.length === 0) throw err('no links in playlist', text)

    tsaudioUrl = '' + new URL(links[0], url)

    cookie =
      res.headers['set-cookie'] != null
        ? res.headers['set-cookie'][0].split(';')[0]
        : undefined
    const found = lines.indexOf(links[0])

    return lines.slice(0, found).concat(TSAUDIONAME).join('\n')
  })

  return { tsaudioUrl, cookie }
}
