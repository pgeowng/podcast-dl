const { downloadBinary } = require('../common')
module.exports = async ({ imageUrl, imagePath }) => {
  await downloadBinary(imageUrl, imagePath)
  return imagePath
}
