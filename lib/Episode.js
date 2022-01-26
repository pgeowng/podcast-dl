
module.exports = class Episode {
  constructor(props) {
    this.provider = props.provider || 'unknown'
    this.date = props.date || '000000'
    this.showName = props.showName
    if (typeof this.showName !== 'string') 
      throw Error("show name is not string. got:" + this.showName)

    this.showTitle = props.showTitle || ''
    this.title = props.title || ''

    this.performers = props.performers || []
    this.guests = props.guests || []
    this.tags = props.tags || {}
    this.imageUrl = props.imageUrl || null
    this.hooks = props.hooks || {}
    this.playlistUrl = props.playlistUrl || null
  }


  mp3Tags() {
    return {
      title: [this.date, this.showName, this.title, this.showTitle]
        .filter(e => e != null)
        .join(' '),
      artist: [...this.performers, ...this.guests]
        .filter(e => e != null)
        .join(' '),
      album: this.showTitle,
      // image: this.imageUrl,
      trackNumber: this.date,
    }
  }

  filename() {
    const tags = Object.keys(this.tags).filter(k => !!this.tags[k])
    tags.sort()
    return [
      this.date,
      this.showName,
      '-'+this.provider,
      ...tags
    ].filter(e => e != null)
      .join('-')
  }

  historyKey() {
    return [this.provider, this.showName, this.date, this.title]
  }

}
