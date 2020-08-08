Q = require '../new/queue-new.coffee'
history = require './history.coffee'

fs = require 'fs'
got = require 'got'
child = require 'child_process'

stream = require('stream');
promisify = require('util').promisify
pipeline = promisify stream.pipeline

tmpdir = require('os').tmpdir()
sep = require('path').sep
cwd = require('process').cwd()

resultPrefix = cwd + sep + "complete" + sep

defaultHeaders =
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0"
	"X-Requested-With": "XMLHttpRequest"

searchWord = "#EXT-X-KEY:METHOD=AES-128,URI="

module.exports = (key) ->
	state = "start"
	working = false

	programData = null
	playcheckData = null
	tsaudioURL = null
	cookie = null
	keyURL = null
	prefixURL = null

	audioFiles = null
	audioIndex = 0
	audioComplete = 0

	fd = null
	name = null
	date = null
	num = ''
	resultPath = null
	imagePath = null

	getKey = () -> [
			programData.access_id
			programData.id
			programData.episode.id
			programData.episode.name
			programData.episode.video.id
		].join('\t')

	process = ->
		console.log state
		switch state
			when "start"
				Q ->
					got "https://vcms-api.hibiki-radio.jp/api/v1/programs/" + key, headers: defaultHeaders
					.then (res) ->
						if res.statusCode != 200
							console.log "[!] coundn't fetch program info -", name, res.statusCode
							return
						programData = JSON.parse('' + res.body)

						if programData.episode == null
							console.log '[!] program', programData.access_id, 'dont have episode. skipping...'
							return

						name = programData.access_id
						d = new Date(programData.episode.updated_at)

						date  = ('0' + (d.getFullYear() % 100))[-2..]
						date += ('0' + (d.getMonth()+1))[-2..]
						date += ('0' + d.getDate())[-2..]

						l = programData.episode.name.indexOf('第')
						r = programData.episode.name.indexOf('回')

						if l != -1 and l != -1
							n = parseInt programData.episode.name[(l+1)...r]
							if n == n
								num = n

						resultPath = resultPrefix + date + '-' + num + '-' + name + '.mp3'
						#history check
						if history.check getKey()
							state = "play_check"
							fd = "./test/"#fs.mkdtempSync("#{tmpdir}#{sep}#{name}") + sep
						else
							state = "skip"
						setTimeout -> Q process

			when "play_check"
				Q ->
					got "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=" + programData.episode.video.id, headers: defaultHeaders
					.then (res) ->
						if res.statusCode != 200
							console.log "[!] coundn't fetch play_check -", name, res.statusCode
							return
						playcheckData = JSON.parse(''+res.body)
						state = 'playlist'
						setTimeout -> Q process

			when "playlist"
				Q ->
					got playcheckData.playlist_url
					.then (res) ->
						if res.statusCode != 200
							console.log "[!] coundn't fetch playlist", name, res.statusCode
							return

						file = (''+res.body).split('\n')

						tsaudioURL = (file.filter (e) -> e.length > 0 and e[0] != '#')[0]
						prefixURL = tsaudioURL.split('/')[0...-1].join('/') + '/'
						console.log(prefixURL)
						cookie = res.headers["set-cookie"][0].split(';')[0]


						# TODO: save changed playlist in temp folder
						console.log file
						fs.writeFileSync(fd + "playlist.m3u8", file[...-2].join('\n') + "\nts_audio.m3u8")

						state = "tsaudio"
						setTimeout -> Q process

			when "tsaudio"
				Q ->
					got tsaudioURL
					.then (res) ->
						if res.statusCode != 200
							console.log "[!] coundn't fetch tsaudio", name, res.statusCode
							return

						file = (''+res.body).split('\n')
						index = 0
						left = 0
						right = 0

						for line in file
							if line.length > searchWord.length and
								line.indexOf(searchWord) == 0
									left = line.indexOf('"')
									right = line.indexOf('"', left+1)
									keyURL = line[(left+1)...right]
									break
							index++

						if keyURL.length == 0
							console.log "[!] coundn't find key url", name, res.statusCode, file
							return

						audioFiles = file.filter (e) -> e.length > 0 and e[0] != '#'

						# TODO: save changed ts_audio.m3u8
						text = file[0...index].join('\n') + '\n'
						text += file[index][0...left]
						text += '"datakey"'
						text += file[index][(right+1)...]
						text += "\n"
						console.log text
						text += file[(index+1)...].join('\n')
						fs.writeFileSync(fd + "ts_audio.m3u8", text)

						state = "key"
						setTimeout -> Q process

			when "key"
				Q ->
					got keyURL, headers: cookie: cookie, "User-Agent": defaultHeaders["User-Agent"]
					.then (res) ->
						if res.statusCode != 200
							console.log "[!] coundn't fetch key", name, res.statusCode, res.body
							return

						if ''+res.rawBody == 'null'
							console.log "[!] key is null", name, res.statusCode, res.body

						fs.writeFileSync fd + "datakey", res.rawBody

						state = "image"
						setTimeout -> Q process

			when "image"
				Q ->
					imagePath = fd + "image.png"
					pipeline(
						got.stream(programData.pc_image_url)
						fs.createWriteStream fd + "image.png")
					.then ->
						state = "audio"
						setTimeout -> Q process

			when "audio"
				Q ->
					filename = audioFiles[audioIndex++]
					pipeline(
						got.stream(prefixURL + filename),
						fs.createWriteStream fd + filename)
					.then ->
						audioComplete++
						if audioComplete == audioFiles.length
							state = "ffmpeg"
						setTimeout -> Q process

			when "ffmpeg"
				Q -> new Promise (resolve, reject) ->
					c = child.spawn(
						"ffmpeg.exe",
						[ '-allowed_extensions','ALL'
							'-i', (fd + "playlist.m3u8").split('\\').join('/')
							'-vn'
							'-acodec', 'libmp3lame'
							'-q:a', '2'
							resultPath]
						)

					c.stdout.on 'data', (d) -> console.log ''+d
					c.stderr.on 'data', (d) -> console.log ''+d
					c.on 'close', ->
						state = 'tags'
						setTimeout -> Q process
						resolve()

			when "tags"
				Q -> new Promise (resolve, reject) ->
					NodeID3 = require 'node-id3'

					title =
						title: [name, num, programDate.episode.name, programData.episode.program_name].join ' '
						artist: programData.casts
											.map((e) -> e.name + (if e.rool_name? then ' ' + e.rool_name else ''))
											.join(' ')
						album: programData.episode.program_name
						image: imagePath
						trackNumber: num
						comment: programData.description

					if not NodeID3.update tags, resultPath
						console.log '[!] tags wasnt written'
						return

					history.save getKey()
					resolve()

	setTimeout -> Q process




module.exports("rf-vg")










