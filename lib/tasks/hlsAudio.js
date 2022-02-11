const err = require('../err')
const hlsAudio = {}

const _playlist = (text) => {
  const chunklists = []
  let idx = 0

  const changedText = text.replace(/^([^#]+?)$/gm, (_, url) => {
    const filename = `chunklist_${index++}.m3u8`
    chunklists.push({ url, filename })
    return filename
  })

  if (chunklists.length === 0) throw err.new('empty playlist file')
  return [chunklists, changedText]
}

hlsAudio.playlist = async (show, ep, playlistBody) => {
  const playlistFilename = 'playlist.m3u8'
  const ctx = ep.ctx
  const [chunklists, changedBody] = _playlist(playlistBody)
  workdir.save(playlistFilename, changedBody)
}
hlsAudio.chunklist = () => {}
hlsAudio.key = () => {}
hlsAudio.audio = () => {}
hlsAudio.mux = () => {}

module.exports = hlsAudio
