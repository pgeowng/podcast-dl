class GeneralProvider {
  constructor(dl, wd) {
    this.dl = dl
    this.wd = wd
  }

  async fetchPlaylist(ep, next) {
    const result = await this.dl.load(ep.ctx.playlistUrl)
    next(result)
  }

  async fetchKeys(keys, next) {
    for (let i = 0; i < keys.length; i++) {
      const params = keys[i];
      const key =  await this.dl.load(params.url, params.dest);
      keys[i].key = key
      // if (''+fs.readFileSync(params.dest) === 'null') {
      //   throw log.error('Loader.loadKeys', Error('key is null'),{
      //     url: params.url,
      //     dest: params.dest,
      //   })
      // }
    }
    next(keys)
  }

  async loadAudio(audio, next) {
    let count = 0
    return async.eachLimit(
      audio,
      6,
      async (params) => await this.dl.save(params.url, params.dest, () => {
        log.statusline(`${(++count)}/${audio.length}`)
        // process.stdout.write('\r'+(++count)+'/'+this.audio.length)
      })
    ).catch(e => {
      throw log.error('Loader.loadAudio', e)
    })
    next()
  }

  async loadImage(dl, url, next) {
    if (url == null) {
      log.msg('Loader.loadImage', "no image for " + this.ep.filename());
      return Promise.resolve()
    }
    return this.dl.save(url, this.wd.image);
  }
}