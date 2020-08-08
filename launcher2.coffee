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



defaultHeaders =
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0"
	"X-Requested-With": "XMLHttpRequest"

searchWord = "#EXT-X-KEY:METHOD=AES-128,URI="

module.exports = start = (programName, resultPrefix) -> Q ->
	got "https://vcms-api.hibiki-radio.jp/api/v1/programs/" + programName, headers: defaultHeaders
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch program info -", programName, res.statusCode
			return

		programData = JSON.parse('' + res.body)

		if programData.episode == null or programData.episode.video == null
			console.log '[!] program', programData.access_id, 'dont have episode. skipping...'
			return

		state = {}
		state.resultPrefix = resultPrefix

		state.programName = programName
		state.programData = programData

		# date

		d = new Date(programData.episode.updated_at)

		state.date  = ('0' + (d.getFullYear() % 100))[-2..]
		state.date += ('0' + (d.getMonth()+1))[-2..]
		state.date += ('0' + d.getDate())[-2..]

		state.num = ''
		l = programData.episode.name.indexOf('第')

		if l != -1
			n = parseInt programData.episode.name[(l+1)..]
			if n == n
				state.num = n

		state.resultPath = "#{state.resultPrefix}#{state.date}-#{state.programName}-#{state.num}-hibiki.mp3"
		console.log state.resultPath
		state.key = [
			programData.access_id
			programData.id
			programData.episode.id
			programData.episode.name
			programData.episode.video.id
		].join('\t')

		state.episodeId = programData.episode.video.id

		if history.check state.key
			state.fd = fs.mkdtempSync("#{tmpdir}#{sep}#{state.programName}") + sep
			get_check(state)
		else
			console.log '[!]', programName, 'already downloaded, skipping...'

		# if programData.addition_video_flg
		# 	new_state = JSON.parse JSON.stringify state
		# 	new_state.isAdditional = true
		# 	new_state.key = [
		# 		programData.access_id
		# 		programData.id
		# 		programData.episode.id
		# 		programData.episode.name
		# 		programData.episode.additional_video.id
		# 	].join('\t')

		# 	state.episodeId = programData.episode.additional_video.id

		# 	new_state.num = new_state.num + 'bonus'
		# 	new_state.resultPath = resultPrefix + state.date + '-' +new_state.num + '-' + state.programName + '-hibiki' + '.mp3'

		# 	if history.check new_state.key
		# 		new_state.fd = fs.mkdtempSync("#{tmpdir}#{sep}#{new_state.programName}") + sep
		# 		get_check new_state



get_check = (state) -> Q ->
	got "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=" + state.episodeId, headers: defaultHeaders
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch play_check -", state.programName, state.episodeId, res.statusCode
			return
		state.playlistURL = JSON.parse(''+res.body).playlist_url
		get_playlist(state)



get_program = (state) ->
	require('get_playlist')(state, get_tsaudio)

get_tsaudio = (state) ->
	require('get_tsaudio')(
		state,
		process_ffmpeg)




get_playlist = (state) -> Q ->
	got state.playlistURL
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch playlist", state.programName, res.statusCode
			return

		file = (''+res.body).split('\n')

		state.tsaudioURL = (file.filter (e) -> e.length > 0 and e[0] != '#')[0]
		state.prefixURL = state.tsaudioURL.split('/')[0...-1].join('/') + '/'
		state.cookie = res.headers["set-cookie"][0].split(';')[0]

		fs.writeFileSync(state.fd + "playlist.m3u8", file[...-2].join('\n') + "\nts_audio.m3u8")
		get_tsaudio(state)

get_tsaudio = (state) -> Q ->
	got state.tsaudioURL
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch tsaudio", state.programName, res.statusCode
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
					state.keyURL = line[(left+1)...right]
					break
			index++

		if state.keyURL == null
			console.log "[!] coundn't find key url", state.programName, res.statusCode, file
			return

		state.audioFiles = file.filter (e) -> e.length > 0 and e[0] != '#'

		# TODO: save changed ts_audio.m3u8
		text = file[0...index].join('\n') + '\n'
		text += file[index][0...left]
		text += '"datakey"'
		text += file[index][(right+1)...]
		text += "\n"
		console.log text
		text += file[(index+1)...].join('\n')
		fs.writeFileSync(state.fd + "ts_audio.m3u8", text)

		get_key(state)

get_key = (state) -> Q ->
	got state.keyURL, { headers:
		cookie: state.cookie,
		"User-Agent": defaultHeaders["User-Agent"]}
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch key", state.programName, res.statusCode, res.body
			return

		if ''+res.rawBody == 'null'
			console.log "[!] key is null", state.programName, res.statusCode, res.body

		fs.writeFileSync state.fd + "datakey", res.rawBody

		get_image(state)

get_image = (state) -> Q ->
	state.imagePath = state.fd + "image.png"
	pipeline(
		got.stream(state.programData.pc_image_url),
		fs.createWriteStream state.imagePath)
	.then ->
		get_audio(state)


get_audio = (state) ->
	state.audioCounter = 0
	for f in state.audioFiles
		Q ((filename, state) ->
			#console.log "get_audio", state
			pipeline(
				got.stream(state.prefixURL + filename),
				fs.createWriteStream state.fd + filename)
			.then ->
				state.audioCounter++
				if state.audioCounter == state.audioFiles.length
					process_ffmpeg(state)
			.catch (e) ->
				console.log e
				console.log state

			).bind(null, f, state)

# get_audio = (state) ->
# 	process_ffmpeg(state)


process_ffmpeg = (state) -> Q -> new Promise (resolve, reject) ->
	c = child.spawn(
		"ffmpeg.exe",
		[ '-allowed_extensions','ALL'
			'-i', (state.fd + "playlist.m3u8").split('\\').join('/')
			'-vn'
			'-acodec', 'libmp3lame'
			'-q:a', '2'
			state.resultPath]
		)

	c.stdout.on 'data', (d) -> console.log ''+d
	c.stderr.on 'data', (d) -> console.log ''+d
	c.on 'error', (err) ->
		console.log err
	c.on 'close', ->
		set_tags(state)
		resolve()

set_tags = (state) -> Q -> new Promise (resolve, reject) ->
	NodeID3 = require 'node-id3'

	tags =
		title: [state.programName, state.num, state.programData.episode.name + (if state.isAdditional then ' 楽屋裏' else ''), state.programData.episode.program_name].join ' '
		artist: state.programData.casts
							.map((e) -> e.name + (if e.rool_name? then ' ' + e.rool_name else ''))
							.join(' ')
		album: state.programData.episode.program_name
		image: state.imagePath
		trackNumber: state.num
		comment: state.programData.description

	if not NodeID3.update tags, state.resultPath
		console.log '[!] tags wasnt written'
		return

	history.save state.key
	resolve()