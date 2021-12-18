require('dotenv').config()
const async = require('async')
const assure = require('./lib/common/assure')
const fs = require('fs')
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

const randName = (...args) =>
  [
    +new Date(),
    ...args,
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
  ].join('-')

let size = 0
let count = 0

const load = (provider, history) => async (item) => {
  console.log('\nloading', item.filename, '-', ++count, '/', size)
  const workdir = path.normalize(process.env.WORKDIR)
  const tempdir = path.resolve(
    process.env.WORKDIR,
    '.' + randName(item.filename)
  )
  const resolveTemp = path.resolve.bind(null, tempdir)
  fse.ensureDirSync(tempdir)

  const playlistHook = assure(provider, 'playlistHook', 'asyncfunction')
  const playlistTask = playlistHook(item)
  const settings = await playlistTask

  const preloadTask = (async () => {
    await playlistTask
    return tasks.preloadTask({ ...settings, resolveTemp })
  })()

  const audioTask = tasks.audioTask({ ...settings, preloadTask })

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
    await history.save(item.historyKey)
  })()

  return audioTask.then((e) => {})
}

const providers = Object.keys(nameMap)

;(async () => {
  const verbose = process.env.VERBOSE
  const debug = process.env.DEBUG
  const skipTrial = process.env.SKIP_TRIAL
  const workdir = path.normalize(process.env.WORKDIR || '')

  const H = require('./lib/history')
  let historyFile = null,
    historyLockFile = null,
    writeHistory = false

  if (!process.env.HISTORY_FILE) {
    console.log('[warn] empty HISTORY_FILE field: ignoring history')
  } else {
    historyFile = path.normalize(process.env.HISTORY_FILE)
  }

  if (!process.env.HISTORY_LOCK_FILE) {
    console.log('[warn] empty HISTORY_LOCK_FILE field: ignoring history write')
  } else {
    historyLockFile = path.normalize(process.env.HISTORY_LOCK_FILE)
  }

  writeHistory = !!process.env.WRITE_HISTORY

  const history = H(historyFile, historyLockFile, writeHistory)

  if (!process.env.FFMPEG) {
    console.log('[err] empty FFMPEG binary path')
    process.exit()
  }

  const ff = require('path').normalize(process.env.FFMPEG)
  if (!fs.existsSync(ff)) {
    console.log('[err] FFMPEG is not exists. check file extention: ' + ff)
    process.exit()
  }

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
  const checked = await Promise.all(
    items.map((e) => history.check(e.historyKey))
  )
  items = items.filter((e, i) => {
    const result = checked[i]
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
