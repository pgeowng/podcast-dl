const stage = require('../stage')
module.exports = async ({
  audioTask,
  imageTask,
  resolveTemp,
  destPath,
  tags,
}) => {
  await audioTask
  await stage.ffmpeg(resolveTemp('playlist.m3u8'), destPath)

  const image = await imageTask
  await stage.tags({ ...tags, image }, destPath)
}
