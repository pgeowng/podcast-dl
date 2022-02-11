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

  playlist(ep, originalText, newFileName = "playlist.m3u8") {
    try {
      const [tsaudioFile, changedText] = playlist(txt, this.wd.tsaudioName)
      ep.ctx.tsaudioUrl = new URL(tsaudioFile, ep.ctx.playlistUrl)
      this.wd.playlist(originalText, changedText);
    } catch (e) {
      throw log.error("Tasks.loadPlaylist", e, {
        message: e.message,
        url: this.playlistUrl,
        text: txt,
        ep: this.ep,
      });
    }
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
