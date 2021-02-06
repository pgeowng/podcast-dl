module.exports = class OnsenData {
  constructor(raw) {
    this.raw = raw

    try {
      this.name()
      this.date()
      this.filename()
      this.checkurl()
    } catch (e) {
      if (e instanceof CustomError) {
        throw e
      } else {
        console.log(e)
      }
    }
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
    return result.join('-')
  }

  checkurl() {
    return (
      'https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=' +
      this.raw.episode.video.id
    )
  }
}
