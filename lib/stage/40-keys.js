const { downloadBinary, err } = require('../common')

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0'

module.exports = async (keys, cookie) => {
  for (let i = 0; i < keys.length; i++) {
    const { url, dest } = keys[i]

    await downloadBinary(
      url,
      dest,
      {
        headers: {
          cookie,
          'User-Agent': userAgent,
        },
      },
      (_, res) => {
        if ('' + res.rawBody === 'null') throw err('key is null')
        if (res.headers['set-cookie'] != null)
          cookie = res.headers['set-cookie'][0].split(';')[0]
        // return res.rawBody
      }
    )
  }
}
