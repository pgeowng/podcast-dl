const assure = require('../common/assure')
const compactDate = require('../common/compactDate')

// historyKey() {
//   return [
//     'hibiki',
//     this.raw.access_id,
//     this.raw.id,
//     this.raw.episode.id,
//     this.raw.episode.name,
//     this.raw.episode.video.id,
//   ].join('\t')
// }

const getPerformers = (raw) => {
  let result = []
  const casts = assure(raw, 'casts', 'array')
  for (let i = 0; i < casts.length; i++) {
    const person = assure(casts, i)
    if (person.name != null) result.push(person.name)
    if (person.rool_name != null) result.push(person.rool_name)
  }
  return result
}

module.exports = (raw) => {
  const programName = assure(raw, 'access_id')
  const programTitle = assure(raw, 'name')
  const performers = getPerformers(raw)

  const ep = assure(raw, 'episode')
  const epTitle = ep.name

  const date = compactDate(new Date(assure(ep, 'updated_at')))

  const videoId = assure(ep, 'video.id')
  const isTrial = false

  return [
    {
      date,
      isPremium: false,
      isTrial: false,
      _playlistUrl: null,
      _checkUrl:
        'https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=' +
        videoId,
      filename: [date, programName, '-hibiki', isTrial ? 'trial' : null]
        .filter((e) => e != null)
        .join('-'),
      tags: {
        title: [date, programName, epTitle, programTitle]
          .filter((e) => e != null)
          .join(' '),
        artist: performers.filter((e) => e != null).join(' '),
        album: programTitle,
        image: assure(raw, 'pc_image_url'),
        trackNumber: date,
      },
      historyKey: ['hibiki', programName, date, epTitle],
    },
  ]
}
