const fs = require('fs')
const path = require('path')

module.exports = (function () {
  if (process.env.WRITE_HISTORY == null)
    return {
      check: () => false,
      save: () => {},
    }

  if (process.env.HISTORY_FILE == null) {
    console.log('history filepath is empty:', process.env.HISTORY_FILE)
    process.exit()
  }

  // check if path is not valid

  const filepath = path.normalize('' + process.env.HISTORY_FILE)
  const file = ('' + fs.readFileSync(filepath)).split('\n')
  const db = {}
  for (let i = 0; i < file.length; i++) {
    db[file[i]] = true
  }

  return {
    check: function (entry) {
      return db[entry] || false
    },
    save: function (entry) {
      if (!!process.env.WRITE_HISTORY) {
        db[entry] = true
        return fs.writeFileSync(filepath, Object.keys(db).join('\n'))
      }
    },
  }
})()
