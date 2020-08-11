Q = require '../Q'
url = require 'url'
path = require 'path'
got = require 'got'
fs = require 'fs'

module.exports = (state, next) ->
	console.log('playlist stage', state.name)
	Q ->
		got state.playlistURL
		.then (res) ->
			if res.statusCode != 200
				console.log "[!] coundn't fetch playlist", state.name, res.statusCode
				return

			file = (''+res.body).split('\n').filter (e) ->
				e.length > 0

#			if file.length != 5 or file[0][0] != '#' or file[1][0] != '#' or file[2][0] != '#'
# 				console.log "[!] something has been changed", state.name, file
# 				return

			state.tsaudioURL = file[file.length-1]

			fs.writeFileSync path.resolve(state.tempdir, "playlist.m3u8"), file[...-1].join('\n') + "\naudio.m3u8"
			console.log("playlist", res.headers["set-cookie"] ? 'null')
			state.cookie = res.headers["set-cookie"][0].split(';')[0]

			setTimeout -> next(state)