history = require '../history'
Q = require '../../Q'
got = require 'got'
path = require 'path'
fs = require 'fs'
got = require 'got'


defaultHeaders = require '../json/defaultHeaders.json'


###
state:
	name
	destdir

state:
	_data
	key
	num
	date
	filename
	dest
	episodeId
	temp
###
module.exports = (state, next) -> Q ->
	got "https://vcms-api.hibiki-radio.jp/api/v1/programs/" + state.name, headers: defaultHeaders
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch program info -", name, res.statusCode
			return

		data = JSON.parse('' + res.body)

		if state.name != data.access_id
			console.log '[!] name != data.access_id', name, data.access_id

		if data.episode == null or data.episode.video == null
			console.log '[!] program', data.access_id, 'dont have episode. skipping...'
			return

		key = [
			data.access_id
			data.id
			data.episode.id
			data.episode.name
			data.episode.video.id
		].join('\t')

		if not history.check key
			console.log '[!]', state.name, 'already downloaded, skipping...'
			return

		state._data = data
		state.key = key
		state.num = ''

		d = new Date(data.episode.updated_at)
		state.date  = ('0' + (d.getFullYear() % 100))[-2..] +
			('0' + (d.getMonth()+1))[-2..] +
			('0' + d.getDate())[-2..]

		match = data.episode.name.match /\d+/
		if match != null
			state.num = match[0]

		state.filename = "#{state.date}-#{state.name}-#{state.num}-hibiki.mp3"
		state.dest = path.resolve state.destdir, state.filename
		state.episodeId = data.episode.video.id

		if not state.tempdir?
			state.tempdir = fs.mkdtempSync(path.resolve(require('os').tmpdir(), state.name))

		setTimeout -> next(state)
