const async = require('async')
const { downloadBinary } = require('../common')

module.exports = async ({ preloadTask, audioOpts }) => {
  const audio = await preloadTask
  await async.eachLimit(
    audio,
    parseInt(process.env.AUDIO_LIMIT || 1),
    async (params) => await downloadBinary(params.url, params.dest, audioOpts)
  )
}
