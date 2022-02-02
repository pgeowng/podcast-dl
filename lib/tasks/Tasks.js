const transformTSAudio = require("./tsaudio");
const transformPlaylist= require('./playlist')
class Tasks {
  constructor(eps, wds, cfgs) {
    this.eps = eps;
    this.cfgs = cfgs;
  }

  loadShows(providerEps) {
    /* validation */
    this.eps.data = [...this.eps.data, providerEps];
  }

  loadPlaylist(wd, ep, providerPlaylist, newFileName = "playlist.m3u8") {
    const [tsaudioFile, playlistText] = playlist(txt, wd.tsaudioName)

    ep.ctx.tsaudioUrl = new URL(tsaudioFile, ep.ctx.playlistUrl)
    wd.playlist(text.replace(regexp, newFileName));
  }

  loadTsaudio(wd, ep, providerTSAudio, newFilename = "tsaudio.m3u8") {
    const [keys, audio, text] = transformTSAudio(providerTSAudio);
    ep.ctx.keys = keys.map((e) => ({
      url: "" + new URL(e.prev, ep.ctx.tsaudioUrl),
      dest: wd.resolve(e.nnew),
    }));

    ep.ctx.audio = audio.map((e) => ({
      url: "" + new URL(e.prev, ep.ctx.tsaudioUrl),
      dest: wd.resolve(e.nnew),
    }));

    wd.tsaudio(text);
  }

  muxFFmpeg(wd, ep) {
    wd.ffmpeg();
  }

  writeTags(wd, ep) {
    wd.tags(ep.mp3Tags());
  }
}
