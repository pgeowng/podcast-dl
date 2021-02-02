const { err } = require('../common')

module.exports = class DataWrap {
  constructor(raw) {
    this.raw = raw

    if (
      raw.episode == null ||
      raw.episode.video == null ||
      raw.episode.video.id == null
    ) {
      throw err('no episode', raw)
    }

    if (this.name() == null) {
      throw err('no name', raw)
    }

    let correctDate = true
    try {
      const date = parseInt(this.date())
      if (date !== date) date = false
    } catch (e) {
      correctDate = false
    }
    if (!correctDate) throw err('no date', this.raw.episode.updated_at)
  }

  name() {
    return this.raw.access_id
  }

  date() {
    const t = new Date(this.raw.episode.updated_at)
    return (
      ('00' + (t.getFullYear() % 100)).slice(-2) +
      ('00' + (t.getMonth() + 1)).slice(-2) +
      ('00' + t.getDate()).slice(-2)
    )
  }

  number() {
    const match = this.raw.episode.name.match(/\d+/)
    if (match != null) return match[0]
    return null
  }

  isTrial() {
    return false
  }

  filename() {
    const num = this.number()
    let result = [this.date(), this.name(), '-hibiki']
    if (num != null) result.push('n' + num)
    if (this.isTrial()) result.push('trial')
    return result.join('-') + '.mp3'
  }

  checkurl() {
    return (
      'https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=' +
      this.raw.episode.video.id
    )
  }

  historyKey() {
    return [
      this.raw.access_id,
      this.raw.id,
      this.raw.episode.id,
      this.raw.episode.name,
      this.raw.episode.video.id,
    ].join('\t')
  }

  tags() {
    const programName = this.raw.episode.program_name

    const title = [
      this.date(),
      this.name(),
      this.raw.episode.name,
      programName,
    ].join(' ')

    const artist = [].concat(
      this.raw.casts
        .map((e) => {
          const arr = [e.name]
          if (e.rool_name != null) arr.push(e.rool_name)
          return arr
        })
        .join(' ')
    )

    return {
      title,
      artist,
      album: programName,
      // image:
      trackNumber: this.date(),
      comment: this.raw.description,
    }
  }
}
