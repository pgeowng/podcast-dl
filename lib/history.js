const fs = require('fs')
const path = require('path')

module.exports = function () {
  const filepath = path.normalize(process.env.HISTORY_FILE)
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
}
