const playlist = require('./playlist.js')

test('correct', () => {
  const text = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=635914,CODECS="avc1.77.30,mp4a.40.2",RESOLUTION=640x360
chunklist.m3u8`
  const resultText = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=635914,CODECS="avc1.77.30,mp4a.40.2",RESOLUTION=640x360
tsaudio.m3u8`
  const result = playlist(text, 'tsaudio.m3u8')
  expect(result[0] === 'chunklist.m3u8').toBe(true)
  expect(result[1] === resultText).toBe(true)
})

test('zero', () => {
  const text = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=635914,CODECS="avc1.77.30,mp4a.40.2",RESOLUTION=640x360`
  expect(() => playlist(text)).toThrow()
})

test('two', () => {
  const text = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=635914,CODECS="avc1.77.30,mp4a.40.2",RESOLUTION=640x360
chunklist.m3u8
another.m3u8`
  expect(() => playlist(text)).toThrow()
})
