Q = require '../Q'
path = require 'path'
child = require 'child_process'
platform = require('os').platform()

log = require '../log'

execFile = "ffmpeg"

if platform == 'win32'
	execFile = "ffmpeg.exe"

writeTags = (state) ->
	NodeID3 = require 'node-id3'
	history = require '../history.coffee'

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
	log.add state.name, "complete"


module.exports = (state, next) -> new Promise (resolve, reject) ->
	log.add state.name, "ffmpeg"
	# idk how to win32 to posix path
	from = path.resolve(state.tempdir, "playlist.m3u8")
	from = from.split('\\').join('/')

	c = child.spawn(
		execFile,
		[ '-allowed_extensions','ALL'
			'-i', from
			'-vn'
			'-acodec', 'libmp3lame'
			'-q:a', '2'
			state.dest]
		)

	c.stdout.on 'data', (d) -> console.log ''+d
	c.stderr.on 'data', (d) -> console.log ''+d

	c.on 'error', (err) ->
		console.log err

	c.on 'close', ->
		writeTags(state)
		next(state)
		resolve()