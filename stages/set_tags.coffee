Q = require '../Q'
history = require '../history'

module.exports = (state, next) -> new Promise (resolve, reject) ->
	NodeID3 = require 'node-id3'

	title = [
		state.name
		state.num
		state._data.episode.name
		state._data.episode.program_name
	].join ' '

	artist = state._data.casts.map((e) ->
		e.name + (if e.rool_name? then ' ' + e.rool_name else '')).join(' ')

	tags =
		title: title
		artist: artist
		album: state._data.episode.program_name
		image: state.imagePath
		trackNumber: state.num
		comment: state._data.description

	if not NodeID3.update tags, state.dest
		console.log '[!] tags wasnt written'
		return

	history.save state.key
	next(state)
	resolve()