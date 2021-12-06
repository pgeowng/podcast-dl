const stage = require('../stage')

module.exports = async ({ playlistUrl, resolveTemp }) => {
  const { tsaudioUrl, cookie } = await stage.playlist(
    playlistUrl,
    resolveTemp('playlist.m3u8')
  )

  const { keys, audio } = await stage.ts(
    tsaudioUrl,
    resolveTemp('tsaudio.m3u8')
  )

  await stage.keys(
    keys.map((e) => ({ ...e, dest: resolveTemp(e.dest) })),
    cookie
  )

  return audio.map((e) => ({ ...e, dest: resolveTemp(e.dest) }))
}
