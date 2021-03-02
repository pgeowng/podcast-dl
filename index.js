require('dotenv').config()
const async = require('async')
const assure = require('./lib/common/assure')
const fse = require('fs-extra')
const path = require('path')

const tasks = require('./lib/tasks')

const nameMap = {
  hibiki: require('./lib/hibiki'),
  onsen: require('./lib/onsen'),
}

const log = console.log
const logVerbose = console.log
const logDebug = console.log

const logState = (name, state) => console.log(`[${state}] ${name}`)

const randName = require('./lib/common/randomName')()
let size = 0
let count = 0

const load = (provider, history) => async (item) => {
  console.log('\nloading', item.filename, '-', ++count, '/', size)
  const workdir = path.normalize(process.env.WORKDIR)
  const tempdir = path.resolve(process.env.WORKDIR, '.' + randName())
  const resolveTemp = path.resolve.bind(null, tempdir)
  fse.ensureDirSync(tempdir)

  const playlistHook = assure(provider, 'playlistHook', 'asyncfunction')
  const playlistTask = playlistHook(item)

  const preloadTask = (async () => {
    const result = await playlistTask
    return tasks.preloadTask({ ...result, resolveTemp })
  })()

  const audioTask = tasks.audioTask({ preloadTask })

  const imageTask = tasks.imageTask({
    imageUrl: item.tags.image,
    imagePath: resolveTemp('image'), // how to delegate to task
  })

  const ffmpegTask = tasks.ffmpegTask({
    audioTask,
    imageTask,
    resolveTemp,
    destPath: path.resolve(workdir, item.filename) + '.mp3',
    tags: item.tags,
  })

  const historySaveTask = (async () => {
    await ffmpegTask
    history.save(item.historyKey)
  })()

  return audioTask.then((e) => {})
}

const providers = Object.keys(nameMap)

;(async () => {
  const verbose = process.env.VERBOSE
  const debug = process.env.DEBUG
  const skipTrial = process.env.SKIP_TRIAL
  const history = await require('./lib/history')
  const workdir = path.normalize(process.env.WORKDIR || '')

  try {
    fse.ensureDirSync(workdir)
  } catch (e) {
    console.log('WORKDIR ensureDir error:', workdir)
    console.error(e)
    process.exit()
  }

  let providerName = process.argv[2]
  if (providers.indexOf(providerName) === -1) {
    console.log(
      'Unknown provider: ',
      providerName,
      ' - only supports:',
      ...providers
    )
    process.exit()
  }

  const mmap = {
    hibiki: 'HIBIKI_IGNORE_NAMES',
    onsen: 'ONSEN_IGNORE_NAMES',
  }

  const IGNORE_NAMES = (process.env[mmap[providerName]] || '').split(' ')
  const provider = nameMap[providerName]

  process.stdout.write('loading names - ')

  const providerList = assure(provider, 'list', 'asyncfunction')
  let names = await providerList()
  // names = ['joshikin']
  names = names.filter((e) => IGNORE_NAMES.indexOf(e) === -1)

  console.log(names.length)
  process.stdout.write('loading info ')
  const providerInfo = assure(provider, 'info', 'asyncfunction')
  let items = await async.mapSeries(names, async.reflect(providerInfo))
  console.log('')

  // handle parseData errors
  let count = 0
  items = items
    .filter(function (e, i) {
      if (e.error != null) {
        count++
        if (debug) {
          logDebug(e.filename, e.error)
        }
      }
      return e.error == null
    })
    .map((e) => e.value)
    .flat()

  log(
    count +
      ' errors have been found.' +
      (!debug ? 'use DEBUG=1 in .env for more detailed info' : '')
  )

  // remove premium - idk how download yet
  items = items.filter((e) => {
    if (e.isPremium && verbose) {
      logState(e.filename, 'premium')
    }
    return !e.isPremium
  })

  // remove trial if so said
  if (skipTrial) {
    items = items.filter((e) => {
      if (verbose && e.isTrial) {
        logState(e.filename, 'trial')
      }
      return !e.isTrial
    })
  }

  // check history
  items = items.filter((e) => {
    const result = history.check(e.historyKey)
    if (verbose && result) {
      logState(e.filename, 'downloaded')
    }
    return !result
  })

  console.log('loading items -', items.length)
  size = items.length

  items.sort(function (a, b) {
    return a.date - b.date
  })

  // loading each item
  const loader = load(provider, history)
  return await async.eachSeries(items, async (i) => {
    return await loader(i).catch(function (err) {
      return logError(i.filename, err.message)
    })
  })
})()
