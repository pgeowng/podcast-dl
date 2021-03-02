const fse = require('fs-extra')
const path = require('path')

module.exports = (async function () {
  const checkHistory = process.env.CHECK_HISTORY
  const writeHistory = process.env.WRITE_HISTORY
  const historyFile = path.normalize(process.env.HISTORY_FILE || '')
  let db = {}

  if (checkHistory || writeHistory) {
    // check if path is not valid

    try {
      fse.ensureFileSync(historyFile)
    } catch (e) {
      console.log('strange HISTORY_FILE:', historyFile)
      console.log('fs.ensureFileSync error:', e)
      process.exit()
    }

    const file = ('' + fse.readFileSync(historyFile)).split('\n')
    for (let i = 0; i < file.length; i++) {
      db[file[i]] = true
    }
  }

  return {
    check: function (entry) {
      if (!checkHistory) return false
      return db[entry.join(',')] || false
    },
    save: function (entry) {
      if (!writeHistory) return
      db[entry.join(',')] = true
      return fse.outputFileSync(historyFile, Object.keys(db).join('\n'))
    },
  }
})()
