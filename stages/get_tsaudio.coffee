Q = require '../../Q'
url = require 'url'
path = require 'path'
got = require 'got'
fs = require 'fs'

stream = require('stream');
promisify = require('util').promisify
pipeline = promisify stream.pipeline

keyKey = "#EXT-X-KEY:METHOD=AES-128,URI="

defaultHeaders = require '../json/defaultHeaders.json'


# state:
#   fdResolve: (file) ->
#   tsaudioURL
#   programName

module.exports = (state, next) ->
	Q ->
		got state.tsaudioURL
		.then (res) ->
			if res.statusCode != 200
				console.log "[!] coundn't fetch tsaudio", state.programName, res.statusCode
				return

			state.keys = []
			state.audio = []

			file = (''+res.body).split('\n')
			newFile = []



			# scheduleFile = (url, filepath) ->
			# 	allcount++
			# 	Q ->
			# 		pipeline(
			# 			got.stream(url),
			# 			fs.createWriteStream(filepath))
			# 		.then ->
			# 			if ++count == allcount
			# 				setTimeout -> next(state)

			# keys = []
			# index = 0
			# launched = false

			# launchKey = (url, filepath) ->
			# 	Q ->
			# 		got url, headers: cookie: state.cookie, "User-Agent": defaultHeaders["User-Agent"]
			# 		.then (res) ->
			# 			if res.statusCode != 200
			# 				console.log "[!] coundn't fetch key. res code strange", state.name, res.statusCode, res.body
			# 				return

			# 			if ''+res.rawBody == 'null'
			# 				console.log "[!] key is null", state.name, res.statusCode, res.body

			# 			fs.writeFileSync filepath, res.rawBody

			# 			if res.headers["set-cookie"]?
			# 				console.log "change cookie"
			# 				state.cookie = res.headers["set-cookie"][0].split(';')[0]

			# 			if index < keys.length
			# 				launchKey.apply null, keys[index++]
			# 			else
			# 				launched = false

			# 			if ++count == allcount
			# 				setTimeout -> next(state)


			# scheduleKey = (url, filepath) ->
			# 	allcount++
			# 	keys.push [url, filepath]

			# 	if not launched
			# 		launched = true
			# 		launchKey.apply null, keys[index++]

			scheduleAudio = (url, filepath) ->
				state.audio.push [url, filepath]

			scheduleKey = (url, filepath) ->
				state.keys.push [url, filepath]

			allcount = 0

			for line in file
				if line.length > 0
					if line[0] != '#' # then its just link
						filename = "a#{allcount++}.ts"
						filepath = path.resolve state.tempdir, filename
						u = url.parse line

						if u.protocol == null # relative link use ts url
							uu = url.resolve(url.resolve(state.tsaudioURL, '.'), line)
						else
							uu = line

						scheduleAudio uu, filepath
						newFile.push filename

					else if line.slice(0, keyKey.length) == keyKey
						l = line.indexOf('"')
						r = line.indexOf('"', l+1)

						filename = "k#{allcount++}.datakey"
						filepath = path.resolve state.tempdir, filename
						uu = line[(l+1)...r]

						newFile.push line[..l] + filename + line[r..]

						scheduleKey uu, filepath
					else
						newFile.push line

			fs.writeFileSync path.resolve(state.tempdir, "audio.m3u8"), newFile.join '\n'

			setTimeout -> next(state)