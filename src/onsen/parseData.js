const assert = require('assert/strict')
const assure = require('../common/assure')
const compactDate = require('../common/compactDate')

const getPerformers = (raw) => {
  let result = []
  const groups = assure(raw, 'personality_groups', 'array')
  for (let i = 0; i < groups.length; i++) {
    const g = assure(groups, i)
    if (g.title != null) result.push(g.title)

    const roles = assure(g, 'role_of_performers', 'array')
    for (let j = 0; j < roles.length; j++) {
      const r = assure(roles, j)
      if (r.name != null) result.push(r.name)
      if (r.role_name != null) result.push(r.role_name)
    }
  }
  return result
}

module.exports = (raw) => {
  const programName = assure(raw, 'directory_name')
  const programTitle = assure(raw, 'program_info.title')
  const performers = getPerformers(raw)

  const today = compactDate(new Date())
  const content = assure(raw, 'contents', 'array')
  let entries = []

  for (let i = 0; i < content.length; i++) {
    const ep = assure(content, i)

    const epTitle = ep.title
    const guests = assure(ep, 'guests', 'array')
    const posterUrl = assure(ep, 'poster_image_url')

    let year = +today.slice(0, 2)
    let info = assure(content, [i, 'delivery_date'], 'string').split('/')
    assert(info.length === 2)
    let date = compactDate(new Date(year, info[0] - 1, info[1]))

    // assuming that if today is 3/30 and date = 3/31 then it was in prev year
    if (+date > +today) {
      date = compactDate(new Date(year - 1, info[0] - 1, info[1]))
    }

    const isTrial = assure(epTitle, [], 'string').indexOf('予告') !== -1

    entries.push({
      date,
      isPremium: ep.premium,
      isTrial: isTrial,
      _playlistUrl: ep.streaming_url,

      filename: [date, programName, '-onsen', isTrial ? 'trial' : null]
        .filter((e) => e != null)
        .join('-'),
      tags: {
        title: [date, programName, epTitle, programTitle]
          .filter((e) => e != null)
          .join(' '),
        artist: [...performers, ...guests].filter((e) => e != null).join(' '),
        album: programTitle,
        image: posterUrl,
        trackNumber: date,
      },
      historyKey: ['onsen', programName, date, epTitle],
    })
  }

  // handling same filenames
  // counting names
  const dict = entries.reduce((acc, d) => {
    const name = d.filename
    if (acc[name] == null) acc[name] = 1
    else acc[name]++
    return acc
  }, {})

  // find unique and remove
  const keys = Object.keys(dict)
  for (let i = 0; i < keys.length; i++) {
    if (dict[keys[i]] === 1) delete dict[keys[i]]
    else dict[keys[i]] = 1
  }

  // add -v#num for dublicates
  entries.forEach((e) => {
    const name = e.filename
    if (dict[name] >= 2) e.filename += `-v${dict[name]}`
    if (dict[name] != null) dict[name]++
  })

  return entries
}
