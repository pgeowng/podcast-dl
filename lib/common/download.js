const fse = require('fs-extra')
const got = require('got')
const err = require('./err.js')

const loader = async (url, dest, opts, cb, type = null) => {
  const res = await got(url, opts != null ? opts : {})
  if (res.statusCode !== 200) {
    throw err('status code ' + res.statusCode)
  }

  let body = res.rawBody
  if (type !== 'binary') {
    body = '' + res.body
  }

  if (type === 'json') {
    try {
      body = JSON.parse(body)
    } catch (e) {
      throw err('json parse error', body)
    }
  }

  if (cb != null) {
    const cbResult = cb(body, res)
    if (cbResult != null) body = cbResult
  }

  if (dest != null) {
    if (!(body instanceof Buffer) && 'object' === typeof body)
      body = JSON.stringify(body, null, 2)
    fse.outputFile(dest, body)
  }

  return body
}

module.exports = {
  download: async (url, dest, opts = null, cb) =>
    loader(url, dest, opts, cb, null),
  downloadJSON: async (url, dest, opts = null, cb) =>
    loader(url, dest, opts, cb, 'json'),
  downloadBinary: async (url, dest, opts = null, cb) =>
    loader(url, dest, opts, cb, 'binary'),
}
