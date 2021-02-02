const { download, err } = require('../common')

module.exports = async (url, dest, tsaudio) => {
  let tsaudiourl, cookie

  await download(url, dest, null, (text, res) => {
    const lines = text.split('\n').filter((e) => e.length > 0)
    const links = lines.filter((e) => e[0] != '#')
    console.log(links)
    if (links.length === 0) throw err('no links in playlist', text)

    tsaudiourl = links[0]
    cookie = res.headers['set-cookie'][0].split(';')[0]
    const found = lines.indexOf(links[0])

    return lines.slice(0, found).concat(tsaudio).join('\n')
  })

  return { tsaudiourl, cookie }
}
