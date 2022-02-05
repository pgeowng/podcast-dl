const log = require('../io/logger.js')
module.exports = (keys) => {
  for (let i = 0; i < keys.length; i++) {
    if (''+keys[i].key === "null") {
      throw log.error('Tasks.keys', Error('key is null'))
    }
    if (keys[i].dest == null) {
      throw log.error('Tasks.keys', Error('no key dest'))
    }
  }
  return [keys]
}