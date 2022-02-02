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




  async ffmpeg() {
    return ffmpeg(this.wd.playlist, this.wd.final);
  }

  async tags() {
    return NodeID3.update({...this.ep.mp3Tags(), image: this.wd.image}, this.wd.final);
  }
};
