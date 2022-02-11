const tasks = require('../../tasks')
const dl = require('../../dl')
const {URL} = require('url')

const normUrl = (url, base) => {
  return ''+new URL(ep.ctx.chunklists[i].url, ep.ctx.playlistUrl)
}

module.exports = (show, ep) => {
  const ctx = ep.ctx
  const playlistName = "playlist.m3u8"
  const playlistUrl = ctx.playlistUrl
  const playlistBody = await dl.load(playlistUrl)
  await tasks.hlsAudio.playlist(show, ep, playlistBody)

  for (let i = 0; i < ctx.chunklists.length; i++) {
    const chunklist = ctx.chunklists[i]
    const chunklistUrl = normUrl(chunklist.url, ep.ctx.playlistUrl)
    const chunklistBody = await dl.load(chunklistUrl)
    await tasks.hlsAudio.chunklist(show, ep, chunklist, chunklistBody)

    for (let j = 0; j < chunklist.keys.length; j++) {
      const key = chunklist.keys[i]
      const keyUrl = normUrl(key.url, chunklistUrl)
      const keyBody = await dl.load(keyUrl)
      await tasks.hlsAudio.key(show, ep, key, keyBody)
    }

    for (let j = 0; j < chunklist.audio.length; j++) {
      const audio = chunklist.audio[i]
      const audioUrl = normUrl(audio.url, chunklistUrl)
      const audioBody = await dl.load(audioUrl)
      await tasks.hlsAudio.audio(show, ep, audio, audioBody)
    }

    tasks.hlsAudio.mux(show, ep)
  }
}