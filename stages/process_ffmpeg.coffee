Q = require '../Q'
path = require 'path'
child = require 'child_process'
platform = require('os').platform()

execFile = "ffmpeg"

if platform == 'win32'
	execFile = "ffmpeg.exe"


module.exports = (state, next) -> Q -> new Promise (resolve, reject) ->

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
		next(state)
		resolve()