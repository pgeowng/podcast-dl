const transformTSAudio = require("./tsaudio");
const transformPlaylist= require('./playlist')
const transformKeys = require('./keys')

module.exports  = class Tasks {
  constructor(eps, wd, cfgs) {
    this.eps = eps;
    this.cfgs = cfgs;
    this.wd = wd;
  }

  loadShows(providerEps) {
    /* validation */
    this.eps.data = [...this.eps.data, providerEps];
  }


  loadTsaudio(wd, ep, providerTSAudio, newFilename = "tsaudio.m3u8") {
    const [keys, audio, text] = transformTSAudio(providerTSAudio);
    ep.ctx.keys = keys.map((e) => ({
      url: "" + new URL(e.prev, ep.ctx.tsaudioUrl),
      dest: this.wd.resolve(e.nnew),
    }));

    ep.ctx.audio = audio.map((e) => ({
      url: "" + new URL(e.prev, ep.ctx.tsaudioUrl),
      dest: this.wd.resolve(e.nnew),
    }));

    this.wd.tsaudio(text);
  }

  loadKeys(keys) {
    const [keys] = transformKeys(keys)
    this.wd.keys(keys)
  }

  loadAudio() {
  }


  muxFFmpeg(wd, ep) {
    this.wd.ffmpeg();
  }

  writeTags(wd, ep) {
    wd.tags(ep.mp3Tags());
  }
}

module.exports = {
  hlsAudio: require('./hlsAudio')
}