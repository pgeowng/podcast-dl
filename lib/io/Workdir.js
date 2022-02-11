const fs = require('fs')
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

  playlist(original, changed) {
    fs.writeFileSync(this.resolve('playlist_orig.m3u8'), original)
    fs.writeFileSync(this.resolve('playlist.m3u8'), changed)
  }

  tsaudio(original, changed) {
    fs.writeFileSync(this.resolve('tsaudio_orig.m3u8'), original)
    fs.writeFileSync(this.resolve('tsaudio.m3u8'), original)
  }

  keys(arr) {
    for (let i = 0; i < arr.length; i++) {
      fs.writeFileSync(arr[i].dest, arr[i].key)
    }
  }

  
}