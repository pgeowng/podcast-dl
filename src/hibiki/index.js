const { downloadJSON } = require('../common')
const parseData = require('./parseData')

const OPTIONS_XML = {
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
}

const list = async () => {
  return (
    await downloadJSON(
      'https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1',
      null,
      OPTIONS_XML
    )
  ).map(function (p) {
    return p.access_id
  })
}

const info = async (name) =>
  parseData(
    await downloadJSON(
      `https://vcms-api.hibiki-radio.jp/api/v1/programs/${name}`,
      null,
      OPTIONS_XML
    )
  )

// must be in each provider
const playlistHook = async (item) => {
  const playlistUrl = (await downloadJSON(item._checkUrl, null, OPTIONS_XML))
    .playlist_url
  return { playlistUrl }
}

module.exports = {
  list,
  info,
  playlistHook,
}
