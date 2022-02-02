const tsaudio = require('./tsaudio')

test('correct', () => {
  const txt = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:17
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI="https://onsen-ma3phlsvod.sslcs.cdngc.net/onsen-ma3pvod/_definst_/mp4:202201/tate220117yi5u-01.mp4/key.m3u8key"
#EXTINF:15.482,
media_0.ts
#EXTINF:7.89,
media_170.ts
#EXT-X-ENDLIST
`
  const [keys, audio, tsaudioText] = tsaudio(txt)
  expect(keys.reduce((acc, e) => acc && e.prev != null && e.nnew != null, true)).toBe(true)
  expect(audio.reduce((acc, e) => acc && e.prev != null && e.nnew != null, true)).toBe(true)
})

test('correct 2 keys', () => {
  const txt = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:17
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI="https://onsen-ma3phlsvod.sslcs.cdngc.net/onsen-ma3pvod/_definst_/mp4:202201/tate220117yi5u-01.mp4/key.m3u8key"
#EXTINF:15.482,
media_0.ts
#EXTINF:7.89,
media_170.ts
#EXT-X-ENDLIST
#EXT-X-KEY:METHOD=AES-128,URI="https://onsen-ma3phlsvod.sslcs.cdngc.net/onsen-ma3pvod/_definst_/mp4:202201/tate220117yi5u-01.mp4/key.m3u8key"
`
  const [keys, audio, tsaudioText] = tsaudio(txt)
  expect(keys.reduce((acc, e) => acc && e.prev != null && e.nnew != null, true)).toBe(true)
  expect(audio.reduce((acc, e) => acc && e.prev != null && e.nnew != null, true)).toBe(true)
})

test('no media', () => {
  const txt = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:17
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI="https://onsen-ma3phlsvod.sslcs.cdngc.net/onsen-ma3pvod/_definst_/mp4:202201/tate220117yi5u-01.mp4/key.m3u8key"
#EXTINF:15.482,
#EXTINF:7.89,
#EXT-X-ENDLIST
#EXT-X-KEY:METHOD=AES-128,URI="https://onsen-ma3phlsvod.sslcs.cdngc.net/onsen-ma3pvod/_definst_/mp4:202201/tate220117yi5u-01.mp4/key.m3u8key"
`
  expect(() => tsaudio.toThrow())
})
