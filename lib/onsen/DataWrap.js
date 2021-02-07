module.exports = class OnsenData {
  constructor(raw) {
    this.raw = raw

    if (raw.contents.length === 0) throw Error('empty program')

    const result = raw.contents.filter((e) => e.premium === false)
    if (result.length > 1)
      console.log('info: ', this.name(), 'contains ', result.length, 'shows')
  }

  name() {
    return this.raw.directory_name
  }

  date() {
    let year = 0,
      month = 0,
      day = 0,
      match = this.raw.current_episode?.delivery_date?.match(
        /(\d+)年(\d+)月(\d+)日/
      )

    if (match != null) {
      ;[, year, month, day] = match
    } else {
      const url = this.audiourl()
      console.log(url)
      if (url != null) {
        match = url.match(/_definst_\/(\d{4})(\d{2})/)
        if (match != null) {
          console.log(match)
          year = match[1]
          month = match[2]
        }
      }

      const delivery_date = this.raw.contents[0]?.delivery_date

      if (delivery_date != null) {
        match = delivery_date.match(/(\d+)\/(\d+)/)

        if (match != null) {
          month = match[1]
          day = match[2]
        }
      }
    }

    return (
      '' +
      ('00' + year).slice(-2) +
      ('00' + month).slice(-2) +
      ('00' + day).slice(-2)
    )
  }

  number() {
    let match
    try {
      const title = this.raw.current_episode.title

      match = title.match(/第(\d+)回/)
      if (match != null) return match[1]

      match = title.match(/(\d+)/)
      if (match != null) return match[1]
    } catch (e) {}

    return null
  }

  rawNum() {
    return this.raw.current_episode?.title
  }

  performers() {
    try {
      return [].concat.apply(
        [],
        this.raw.personality_groups.map((e) => {
          let result = []
          if (e.title != null) result.push(e.title)
          return [].concat.apply(
            result,
            e.role_of_performers.map((e) => {
              let result = []
              if (e.name != null) result.push(e.name)
              if (e.role_name != null) result.push(e.role_name)
              // if (e.twitter_id != null) result.push('@' + e.twitter_id)
              // if (e.instagram_id != null) result.push('inst:' + e.instagram_id)
              return result
            })
          )
        })
      )
    } catch (e) {
      console.log('performers parse error', e)
      return []
    }
  }

  isTrial() {
    return this.raw.contents[0]?.title.indexOf('予告') !== -1
  }

  playlisturl() {
    return this.raw.contents[0]?.streaming_url || null
  }

  imageurl() {
    return this.raw.program_info?.image?.url || null
  }

  filename() {
    const num = this.number()
    let result = [this.date(), this.name(), '-onsen']
    if (num != null) result.push('n' + num)
    if (this.isTrial()) result.push('trial')
    return result.join('-') + '.mp3'
  }

  tags() {
    const date = this.date()
    const name = this.name()
    const num = this.raw.contents[0]?.title
    const programTitle = this.raw.program_info.title

    // console.log('get history', this.performers())
    return {
      title: [date, name, num, programTitle].filter((e) => e != null).join(' '),
      artist: this.performers().join(' '),
      album: programTitle,
      // image: this.imageurl(),
      trackNumber: date,
    }
  }

  historyKey() {
    const show = this.raw.contents[0]
    return [
      'onsen',
      this.name(),
      show.program_id,
      show.id,
      show.title,
      show.delivery_date,
    ].join('\t')
  }
}
