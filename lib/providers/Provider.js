const async = require('async')
const fs = require("fs");
const log = require("./logger");
const { URL } = require("url");
const Got = require("./Got");
const playlist = require("./stage/playlist");
const tsaudio = require("./stage/tsaudio");
const ffmpeg = require('./stage/ffmpeg')
const NodeID3 = require('node-id3').Promise

class GeneralProvider {
  constructor(dl, uc, wd) {
    this.dl = dl
    this.wd = wd
  }

  async playlist(dl, playlistUrl) {
    return await dl.load(playlistUrl)
  }

  async fetchKeys(dl, keys) {
    for (let i = 0; i < keys.length; i++) {
      const params = keys[i];
      const key =  await dl.load(params.url, params.dest);
      keys[i].key = key
      if (''+ key === 'null') {
        throw log.error('Provider.fetchKeys', Error('key is null'), {
          url: params.url,
          dest: params.dest,
        })
      }
    }
    return keys
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

  // constructor(ep, workdir, gotProps) {
  //   this.ep = ep;
  //   this.wd = workdir;
  //   this.got = new Got(gotProps);
  //   this.playlistUrl = null;
  //   this.tsaudioUrl = null;
  //   this.keys = null;
  //   this.audio = null;
  //   this.playlistText = null
  //   this.tsaudioText = null
  // }


  async loadTsaudio() {
    let txt = null;
    try {
      txt = await this.got.load(this.tsaudioUrl);
      fs.writeFileSync(this.wd.tsaudioOrig, txt)
    } catch (e) {
      throw log.error("Loader.loadTsaudio", e, {
        ep: this.ep,
      });
    }
    try {
      const [keys, audio, tsaudioText] = tsaudio(txt);

      this.keys = keys.map((e) => ({
        url: "" + new URL(e.prev, this.tsaudioUrl),
        dest: this.wd.resolve(e.nnew),
      }));

      this.audio = audio.map((e) => ({
        url: "" + new URL(e.prev, this.tsaudioUrl),
        dest: this.wd.resolve(e.nnew),
      }));

      fs.writeFileSync(this.wd.tsaudio, tsaudioText);
    } catch (e) {
      throw log.error('Loader.loadTsaudio', e, {
        url: this.tsaudioUrl,
        text: txt
      })
    }
  }




  async ffmpeg() {
    return ffmpeg(this.wd.playlist, this.wd.final);
  }

  async tags() {
    return NodeID3.update({...this.ep.mp3Tags(), image: this.wd.image}, this.wd.final);
  }
};

