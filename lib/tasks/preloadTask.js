const stage = require('../stage')

module.exports = async ({ playlistUrl, resolveTemp, playlistOpts = null, tsaudioOpts = null, keysOpts = null }) => {
  const { tsaudioUrl, cookie } = await stage.playlist(
    playlistUrl,
    resolveTemp('playlist.m3u8'),
    playlistOpts
  )

  const { keys, audio } = await stage.ts(
    tsaudioUrl,
    resolveTemp('tsaudio.m3u8'),
    tsaudioOpts
  )

  await stage.keys(
    keys.map((e) => ({ ...e, dest: resolveTemp(e.dest) })),
    cookie,
    keysOpts
  )

  return audio.map((e) => ({ ...e, dest: resolveTemp(e.dest) }))
}
