const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const sleep = (ms) => new Promise((res, rej) => setTimeout(() => res(), ms))

module.exports = function (historyFile, historyLockFile, writeHistory = true) {
  let checkHistory = !!historyFile
  writeHistory = checkHistory && writeHistory

  if (checkHistory) {
    // check if path is not valid

    try {
      fse.ensureFileSync(historyFile)
    } catch (e) {
      console.log('[err] strange HISTORY_FILE:', historyFile)
      console.log('[err] fs.ensureFileSync:', e)
      process.exit()
    }
  }

  const isLocked = () => fs.existsSync(historyLockFile)
  const lockHistory = () => {
    fse.ensureFileSync(historyLockFile)
  }
  const unlockHistory = () => fse.rmSync(historyLockFile)

  const openHistory = async () => {
    let lock = isLocked()
    while (lock) {
      await sleep(100)
      lock = isLocked()
    }
    lockHistory()
  }

  const closeHistory = async () => {
    unlockHistory()
  }

  const lookupHistory = async (key) => {
    let db = {}
    const file = ('' + fse.readFileSync(historyFile))
      .split('\n')
      .filter((e) => e.length !== 0)
    for (let i = 0; i < file.length; i++) {
      db[file[i]] = true
    }

    return db[key] || false
  }

  const appendHistory = async (key) => {
    let db = {}
    const file = ('' + fse.readFileSync(historyFile)).split('\n')
    for (let i = 0; i < file.length; i++) {
      db[file[i]] = true
    }

    db[key] = true
    try {
      fse.outputFileSync(historyFile, Object.keys(db).sort().join('\n'))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  return {
    check: async function (entry) {
      if (!checkHistory) return false

      await openHistory()
      const status = await lookupHistory(entry.join(','))
      await closeHistory()

      return status
    },
    save: async function (entry) {
      if (!writeHistory) return false

      await openHistory()
      const status = await appendHistory(entry.join(','))
      await closeHistory()

      return status
    },
  }
}
