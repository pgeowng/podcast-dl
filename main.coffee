path = require 'path'
cwd = require('process').cwd()
got = require 'got'

url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1"
launcher = require('./launcher3')

config = require('./config.json')

# program = require('commander').program
# program.version('0.0.1')

# program
# .option '-d, --debug <name>', 'download only one file'
# #.option '-td, --tempdir <path>'

# program.parse process.argv

# if program.debug
# 	launcher
# 		name: program.debug
# 		destdir: destdir
# 		tempdir: path.resolve destdir, '../test'
# else
# 	got url, headers: require('./json/defaultHeaders.json')
# 	.then (res) ->
# 		data = JSON.parse res.body
# 		names = data.map (p) -> p.access_id
# 		names.filter (e) -> e != 'morfonica'
# 		for n in names
# 			launcher
# 				name: n
# 				destdir: destdir

got = require 'got'
stream = require 'stream'
promisify = require('util').promisify
pipeline = promisify stream.pipeline


getFile = (params) ->
	pipeline(
		got.stream(params.url),
		fs.createWriteStream(params.path))

init = ->
	try
		res = await got url, headers: config.headers
		names = JSON.parse(res.body).map (p) -> p.access_id
		filtered = names.filter (e) -> config.ignore.indexOf(e) == -1

		for n in filterNames
			loadProgram n
				# name: n
				# destdir: config.destdir

	catch e
		console.log "get names error #{e}"

loadProgram = (name) ->
	tempdir = fs.mkdtempSync("#{tmpdir}#{sep}hibiki-dl-#{name}-") + sep
	imagepath = path.resolve tempdir, "image"


	try
		# getProgram
		res = await Q got.bind null, "https://vcms-api.hibiki-radio.jp/api/v1/programs/#{name}", headers: config.headers

		if res.statusCode != 200
			throw Error "getProgram status code is #{res.statusCode}"

		_data = JSON.parse(''+res.body)

		if name != _data.access_id
			throw Error 'getProgram name != _data.access_id -- ' + name + ' ' + _data.access_id

		if _data.episode == null or data.episode.video == null
			throw Error "dont have episode"

		# checkHistory
		historyKey = [
			_data.access_id,
			_data.id,
			_data.episode.id,
			_data.episode.name,
			_data.episode.video.id
		].join '\t'

		if history.isWas historyKey
			throw Error "already downloaded"

		log.add name, "downloading"

		# preparePaths
		_t = new Date(data.episode.updated_at)
		episodeDate = ('0' + (d.getFullYear() % 100))[-2..] +
			('0' + (d.getMonth()+1))[-2..] +
			('0' + d.getDate())[-2..]

		episodeNumber = ''
		_t = data.episode.name.match /\d+/
		if match != null
			episodeNumber = match[0]

		filename = "#{episodeDate}-#{name}-#{episodeNumber}-hibiki.mp3"
		dest = path.resolve config.destdir, filename

		# getCheck
		episodeId = _data.episode.video.id
		checkURL = "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id="
		res = await Q got.bind null, "#{checkURL}#{episodeId}", headers: config.headers

		if res.statusCode != 200
			throw Error "fetch check statusCode #{res.statusCode}"

		playlistURL = JSON.parse(''+res.body).playlist_url

		# getImage
		imageURL = _data.pc_image_url
		await Q getFile.bind null,
			url: imageURL
			path: imagepath# change to dest?



		# getPlaylist
		res = await got playlistURL

		if res.statusCode != 200
			throw Error "playlist status #{res.statusCode}"


		file = (''+res.body).split('\n').filter (e) ->
			e.length > 0

		links = []
		index = 0

		index++ while index < file.length and file[index][0] == '#'

		if index == file.length
			throw Error "playlist link dont found \n #{file.join '\n'}"

		tsaudioURL = file[index]
		cookie = res.headers["set-cookie"][0].split(';')[0]

		fs.writeFileSync path.resolve(state.tempdir, "playlist.m3u8"),
			file[...index].concat("audio.m3u8").join('\n')

		# getTsaudio

		res = await got tsaudioURL

		if res.statusCode != 200
			throw Error "tsaudio status #{res.statusCode}"

		file = (''+res.body).split '\n'
		tsStream = fs.createWriteStream path.resolve tempdir, "audio.m3u8"
		keys = []
		audio = []
		keyKey = "#EXT-X-KEY:METHOD=AES-128,URI="

		for line, key in file when line.length > 0
			_file = ''+key
			_dest = path.resolve tempdir, _file

			if line[0] != '#' # audio
				srcURL = line
				if url.parse(line).protocol == null # is it relative link
					srcURL = url.resolve url.resolve(tsaudioURL, '.'), line

				audio.push
					url: srcURL
					dest: _dest
				tsStream.write(_file)

			else if line.slice(0, keyKey.length) == keyKey
				l = line.indexOf('"')
				r = line.indexOf('"', l+1)

				keys.push
					url: line[(l+1)...r]
					dest: _dest

				tsStream.write line[..l] + filename + line[r..]
			else
				tsStream.write line

		tsStream.end()








	catch e
		log.add name, e
		return




init()