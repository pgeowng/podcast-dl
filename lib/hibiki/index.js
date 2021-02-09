const async = require('async')
const fse = require('fs-extra')
const path = require('path')

const { downloadJSON, downloadBinary } = require('../common')
const history = require('../history')
const stage = require('../stage')

const OPTIONS_XML = {
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
} // is it necessary?

const DataWrap = require('./DataWrap')
DataWrap.prototype.load = async function () {
  const tempdir = path.resolve(
    process.env.WORKDIR,
    '.pod-hibiki-' + this.name()
  )
  this._temp = path.resolve.bind(null, tempdir) // move to prototype
  fse.ensureDirSync(tempdir)

  const preloadTask = (async () => {
    const playlisturl = (await downloadJSON(this.checkurl(), null, OPTIONS_XML))
      .playlist_url

    const { tsaudiourl, cookie } = await stage.playlist(
      playlisturl,
      this._temp('playlist.m3u8')
    )

    const { keys, audio } = await stage.ts(
      tsaudiourl,
      this._temp('tsaudio.m3u8')
    )

    await stage.keys(
      keys.map((e) => ({ ...e, dest: this._temp(e.dest) })),
      cookie
    )

    return audio.map((e) => ({ ...e, dest: this._temp(e.dest) }))
  })()

  const audioTask = (async () => {
    const audio = await preloadTask
    await async.eachLimit(
      audio,
      parseInt(process.env.AUDIO_LIMIT),
      async (params) => await downloadBinary(params.url, params.dest)
    )
  })()

  const imageTask = (async () => {
    const imagepath = this._temp('image')
    await downloadBinary(this.imageurl(), imagepath)
    return imagepath
  })()

  await Promise.all([audioTask, imageTask])

  const ffmpegTask = (async () => {
    const dest = path.resolve(process.env.WORKDIR, this.filename())
    await stage.ffmpeg(this._temp('playlist.m3u8'), dest)

    const image = await imageTask
    await stage.tags({ ...this.tags(), image }, dest)
    history.save(this.historyKey())
  })()
}

const loadList = async () => {
  try {
    return (
      await downloadJSON(
        'https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1',
        null,
        OPTIONS_XML
      )
    ).map(function (p) {
      return p.access_id
    })
    // .filter(function (e) {
    //   return IGNORE_NAMES.indexOf(e) === -1
    // })
  } catch (error) {
    e = error
    return console.log(`get names error ${e}`)
  }
}

const check = async (name) => {
  const data = new DataWrap(
    await downloadJSON(
      `https://vcms-api.hibiki-radio.jp/api/v1/programs/${name}`,
      null,
      OPTIONS_XML
    )
  )

  if (history.check(data.historyKey())) {
    throw Error('already downloaded')
  }

  if (process.env.SKIP_TRIAL && data.isTrial()) {
    throw Error('skipping trial version')
  }

  return data
}

module.exports = {
  loadList,
  check,
}
