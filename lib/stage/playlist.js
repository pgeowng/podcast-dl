const regexp = /^[^#]+?$/gm
module.exports = (text, newFileName = 'tsaudio.m3u8') => {
  const result = text.match(/^[^#]+?$/gm)
  if (result == null)
    throw Error("empty playlist file")
  if (result.length > 1)
    throw Error("too many tsaudio files")

  return [result[0], text.replace(regexp, newFileName)]
}
