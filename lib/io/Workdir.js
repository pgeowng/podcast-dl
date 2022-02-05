const fse = require('fs-extra')
const path = require('path')

const randName = (...args) =>
  [
    +new Date(),
    ...args,
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
  ].join('-')

module.exports = class Workdir {
  constructor(cwd, prefix, files) {
    this.cwd = cwd
    this.prefix = prefix
    this.tempdir = path.resolve(this.cwd, this.prefix)
    fse.ensureDirSync(this.resolve('.'))

    for (const file in files) {
      this[file] = this.resolve(files[file])
      this[file+'Name'] = files[file]
    }
  }

  resolve(...p) {
    return path.resolve(this.tempdir, ...p)
  }

  
}