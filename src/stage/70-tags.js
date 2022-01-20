const NodeID3 = require('node-id3').Promise

// title: date name episodeNum programTitle
// artists:
// album: programTitle
// image: imagepath
// trackNumber: date
module.exports = (tags, filepath) => NodeID3.update(tags, filepath)
