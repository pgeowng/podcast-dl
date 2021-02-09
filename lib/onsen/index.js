const async = require('async')
const fse = require('fs-extra')
const path = require('path')
const stage = require('../stage')
const history = require('../history')

const DataWrap = require('./DataWrap')
const { download, downloadJSON, downloadBinary, err } = require('../common')

const OPTIONS = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0',
    'X-Requested-With': 'XMLHttpRequest',
  },
}

const _resolveTmp = (tempdir) => (filename) => path.resolve(tempdir, filename)

DataWrap.prototype.load = async function () {
  console.log('loading', this.name())
  const tempdir = path.resolve(process.env.WORKDIR, '.pod-onsen-' + this.name())
  const resolveTemp = _resolveTmp(tempdir)
  fse.ensureDirSync(tempdir)

  const preloadTask = (async () => {
    const { tsaudiourl } = await stage.playlist(
      this.playlisturl(),
      resolveTemp('playlist.m3u8')
    )

    const { keys, audio } = await stage.ts(
      tsaudiourl,
      resolveTemp('tsaudio.m3u8')
    )

    await stage.keys(keys.map((e) => ({ ...e, dest: resolveTemp(e.dest) })))

    return audio.map((e) => ({ ...e, dest: resolveTemp(e.dest) }))
  })()

  const audioTask = (async () => {
    const audio = await preloadTask
    console.log('audio', audio.length)
    await async.eachLimit(
      audio,
      parseInt(process.env.AUDIO_LIMIT),
      async (params) => {
        await downloadBinary(params.url, params.dest)
      }
    )
  })()

  const imageTask = (async () => {
    const imagepath = resolveTemp('image')
    await downloadBinary(this.imageurl(), imagepath)
    return imagepath
  })()

  await Promise.all([audioTask, imageTask])

  const ffmpegTask = (async () => {
    await audioTask
    const dest = path.resolve(process.env.WORKDIR, this.filename())
    await stage.ffmpeg(resolveTemp('playlist.m3u8'), dest)

    const imagepath = await imageTask
    await stage.tags({ ...this.tags(), image: imagepath }, dest)
    history.save(this.historyKey())
  })()
}

const loadList = async () => {
  return await download('https://www.onsen.ag/', null, null, (text) => {
    let window = {},
      code

    try {
      code = text.match(/<script>(window.__NUXT__=.+?)<\/script>/)[1]
    } catch (e) {
      throw err('<script> not found')
    }

    try {
      eval(code) // really dangerous - they can use fs, net
      return window.__NUXT__.state.programs.programs.all.map(
        (e) => e.directory_name
      )
    } catch (e) {
      throw err('error when executing script', e)
    }
  })
}

const check = async (name) => {
  data = new DataWrap(
    await downloadJSON('https://www.onsen.ag/web_api/programs/' + name)
  )

  if (history.check(data.historyKey())) throw Error('already downloaded') // history.check should throw

  if (process.env.SKIP_TRIAL && data.isTrial())
    throw Error('skipping trial version')

  return data
}
module.exports = { loadList, check }
