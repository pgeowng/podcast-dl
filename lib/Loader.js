const async = require('async')
const fs = require("fs");
const log = require("./logger");
const { URL } = require("url");
const Got = require("./Got");
const playlist = require("./stage/playlist");
const tsaudio = require("./stage/tsaudio");
const ffmpeg = require('./stage/ffmpeg')
const NodeID3 = require('node-id3').Promise

module.exports = class Loader {
  constructor(ep, workdir, gotProps) {
    this.ep = ep;
    this.wd = workdir;
    this.got = new Got(gotProps);
    this.playlistUrl = null;
    this.tsaudioUrl = null;
    this.keys = null;
    this.audio = null;
    this.playlistText = null
    this.tsaudioText = null
  }

  async loadPlaylist() {
    if (ep.hooks.preload != null) await ep.hooks.preload();
    this.playlistUrl = this.ep.playlistUrl;

    let txt = null;
    try {
      txt = await this.got.load(this.playlistUrl);
      fs.writeFileSync(this.wd.playlistOrig, txt)
    } catch (e) {
      throw log.error("Loader.loadPlaylist", e, {
        ep: this.ep,
      });
    }
    try {
      const [tsaudio, playlistText] = playlist(txt, this.wd.tsaudioName);
      this.tsaudioUrl = "" + new URL(tsaudio, this.playlistUrl);
      fs.writeFileSync(this.wd.playlist, playlistText);
    } catch (e) {
      throw log.error("Loader.loadPlaylist", e, {
        message: e.message,
        url: this.playlistUrl,
        text: txt,
        ep: this.ep,
      });
    }
  }

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

  async loadKeys() {
    for (let i = 0; i < this.keys.length; i++) {
      const params = this.keys[i];
      await this.got.save(params.url, params.dest);
      if (''+fs.readFileSync(params.dest) === 'null') {
        throw log.error('Loader.loadKeys', Error('key is null'),{
          url: params.url,
          dest: params.dest,
          ep: this.ep,
        })
      }
    }
  }

  async loadAudio() {
    let count = 0
    return async.eachLimit(
      this.audio,
      6,
      async (params) => await this.got.save(params.url, params.dest, () => {
        log.statusline(`${(++count)}/${this.audio.length}`)
        // process.stdout.write('\r'+(++count)+'/'+this.audio.length)
      })
    ).catch(e => {
      throw log.error('Loader.loadAudio', e, {
        ep: this.ep
      })
    })
  }

  async loadImage() {
    if (this.ep.imageUrl == null) {
      log.msg('Loader.loadImage', "no image for " + this.ep.filename());
      return Promise.resolve()
    }
    return this.got.save(this.ep.imageUrl, this.wd.image);
  }

  async ffmpeg() {
    return ffmpeg(this.wd.playlist, this.wd.final);
  }

  async tags() {
    return NodeID3.update({...this.ep.mp3Tags(), image: this.wd.image}, this.wd.final);
  }
};
