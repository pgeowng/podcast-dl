const async = require('async')
const log = require('./io/logger')
const Loader = require('./providers/Loader.js')
const Workdir = require('./io/Workdir.js')
const config = {
  strict: true
}

const main = async () => {
  const onsen = require('./onsen/onsen.js')
  let eps = await onsen.shows()

  // eps = eps.slice(0, 1)

  eps = eps.filter(ep =>
    !ep.tags.trial && !ep.tags.premium
  )

  eps.sort((a , b) => {
    return a.filename() - b.filename()
  })

  const donePromises = []
  const nowStr  = () => {
    const n = new Date()
    const pad = (str, n=2) => (Array(n).fill('0').join('') + str).slice(-n)
    return `${pad(n.getFullYear())}${pad(n.getMonth()+1)}${pad(n.getDate())}-${pad(n.getHours())}${pad(n.getMinutes())}${pad(n.getSeconds())}`
  }

  useShowListInput = provider.showList()
  useShowListOutput = use.showList(useShowListInput)

  // return await async.eachSeries(eps, async (ep) => {
  for (let i = 0; i < eps.length; i++) {
    const ep = eps[i]
    const wd = new Workdir(process.cwd(), "." + nowStr() + '-' + ep.filename(), {
      playlist: "playlist.m3u8",
      playlistOrig: 'playlist_orig.m3u8',
      tsaudio: "tsaudio.m3u8",
      tsaudioOrig: 'tsaudio_orig.m3u8',
      image: "image",
      final: ep.filename() + ".mp3"
    })
    const l = new Loader(ep, wd, onsen.GOT_PROPS)

    log.status.ep = ep.filename()

    try {
      const imagePromise = l.loadImage().catch(e => console.error(e))

      log.status.stage = 'playlist'
      log.statusline()
      await l.loadPlaylist()

      log.status.stage = 'tsaudio'
      log.statusline()
      await l.loadTsaudio()

      log.status.stage = 'keys'
      log.statusline()
      await l.loadKeys()

      // log.status.stage = 'audio'
      // log.statusline()
      // await l.loadAudio()

      log.status.stage = 'post'
      log.statusline('\n')

      log.status.bg++
      // donePromises.push((async () => {
      //   wd.image = await imagePromise
      //   await l.ffmpeg()
      //   await l.tags()
      //   log.status.bg--
      // })())

      donePromises.push(() => new Promise((res)=> {
        setTimeout(() => {
          res()
          log.status.bg--
        }, 5000)
      }))

    } catch (e) {
      console.error(e)
      if (config.strict) {
        process.exit(1)
      }
    }
    // return Promise.resolve()
  // }).catch(e => {
  //   console.error(e)
  // })
  }
}

main()
