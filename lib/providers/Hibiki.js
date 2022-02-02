const { downloadJSON } = require('../common')
const parseData = require('./parseData')

const XHRHeader = {
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
}

class Hibiki {

  async fetchShows(dl, input) {
    const result = await dl.load(
      'https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1',
      XHRHeader
    )

    input.loadShows(parseShows(result))
  }

  getPerformers(raw) {
    const result = []
    if (!Array.isArray(raw.casts))
      throw Error("raws.ep.casts isn't array")
    const casts = raw.casts
    for (let i = 0; i < casts.length; i++) {
      const person = casts[i]
      if (person.name != null) result.push(person.name)
      if (person.rool_name != null) result.push(person.rool_name)
    }
  return result
  }
  

  parseShows(raws) {
    const result = []

    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i]
      const imageUrl = raw.pc_image_url
      const showId = raw.access_id
      const showTitle = raw.name
      const performers = this.getPerformers(raw)
      const ep = raw.episode
      const title = ep.name
      const date = new Date(ep.updated_at)

      result.push(new Episode({
        provider: 'hibiki',
        date,
        showId,
        showTitle,
        title,
        performers,
        tags: {},
        imageUrl,
        playlistUrl: null
      }))
    }
    return result
  }

  prePlaylistHook(dl, ) {
  }
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
