const { download, downloadJSON, err } = require('../common')
const parseData = require('./parseData')

const list = async () => {
  return await download('https://www.onsen.ag/', null, null, (text) => {
    let window = {},
      code

    try {
      code = text.match(/<script>(window.__NUXT__=.+?)<\/script>/)[1]
    } catch (e) {
      throw err('<script> not found')
    }

    try {
      require = () => {}
      eval(code) // really dangerous - they can use fs, net
      return window.__NUXT__.state.programs.programs.all.map(
        (e) => e.directory_name
      )
    } catch (e) {
      throw err('error when executing script', e)
    }
  })
}

const info = async (name) =>
  parseData(await downloadJSON('https://www.onsen.ag/web_api/programs/' + name))

// must be in each provider - cant
const playlistHook = async (item) => ({
  playlistUrl: item._playlistUrl,
  playlistOpts: {
    headers: {
      "Referer":"https://www.onsen.ag/"
    }
  },
  tsaudioOpts: {
    headers: {
      "Referer":"https://www.onsen.ag/"
    }
  },
  keysOpts: {
    headers: {
      "Referer":"https://www.onsen.ag/"
    }
  },
  audioOpts: {
    headers: {
      "Referer":"https://www.onsen.ag/"
    }
  }
})

module.exports = {
  list,
  info,
  playlistHook,
}
