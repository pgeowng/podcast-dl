const  headersBase = {
  'X-Requested-With': 'XMLHttpRequest',
}

module.exports = (text) => {
  let index = 0
  let keys = []
  let audio = []
  let match = null

  text = text.replace(
    /(#EXT-X-KEY:METHOD=AES-128,URI=")([^"]*)([^\n]*)/g,
    (_, p1, p2, p3) => {
      const name = index++ + '.key'
      keys.push({ prev: p2, nnew: name })
      return [p1, name, p3].join('')
    }
  )

  const fileRE = /(.*)\n/g
  match = text.match(fileRE)
  if (match == null)
    throw Error("no media files")

  text = text.replace(fileRE, (_, p1) => {
    if (p1[0] == '#') return p1 + '\n'
    const name = index++ + '.ts'

    audio.push({
      prev: p1,
      nnew: name,
    })

    return name + '\n'
  })
  return [ keys, audio, text ]
}
