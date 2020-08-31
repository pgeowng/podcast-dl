fs = require 'fs'
path = require 'path'
url = require 'url'

cwd = require('process').cwd()
tmpdir = require('os').tmpdir()
sep = require('path').sep

got = require 'got'
stream = require 'stream'
promisify = require('util').promisify
pipeline = promisify stream.pipeline

#launcher = require('./launcher3')

config = require('./config.json')
Log = require('./lib/log')
Queue = require('./lib/Queue2')
history = require('./lib/history')

launchQ = Queue(1)
downloadQ = Queue(8)
ffmpegQ = Queue()

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

promiseSerial = (arr) ->
	wasError = false
	count = 0
	size = arr.length

	p = arr[0]()

	for n in arr[1..]
		p = p.then(n)

	return p

getFile = (params) ->
	pipeline(
		got(params.url, isStream: true, headers: config.headers),
		fs.createWriteStream(params.dest))

init = ->
	try
		console.log 'fetching names...'
		res = await got "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1",
			headers: config.headers
		names = JSON.parse(res.body).map (p) -> p.access_id
		filtered = names.filter (e) -> config.ignore.indexOf(e) == -1


		promiseSerial filtered.map (e) ->
			loadProgram.bind(null, e)


	catch e
		console.log "get names error #{e}"






loadProgram = (name) -> new Promise (resolveLock, reject) ->
	log = Log.add.bind null, name
	# log = (a) -> console.log a
	try
		tempdir = fs.mkdtempSync("#{require('os').tmpdir()}#{sep}hibiki-dl-#{name}-") + sep
		imagePath = path.resolve tempdir, "image"

		# getProgram
		res = await got "https://vcms-api.hibiki-radio.jp/api/v1/programs/#{name}",
			headers: config.headers

		if res.statusCode != 200
			throw Error "getProgram status #{res.statusCode}"

		_data = JSON.parse(''+res.body)

		if name != _data.access_id
			throw Error 'getProgram name != _data.access_id -- ' + name + ' ' + _data.access_id

		if _data.episode == null or _data.episode.video == null
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

		log "downloading"


		# preparePaths
		tmp = new Date(_data.episode.updated_at)
		episodeDate = ('0' + (tmp.getFullYear() % 100))[-2..] +
			('0' + (tmp.getMonth()+1))[-2..] +
			('0' + tmp.getDate())[-2..]

		episodeNumber = ''
		tmp = _data.episode.name.match /\d+/
		if tmp != null
			episodeNumber = tmp[0]

		filename = "#{episodeDate}-#{name}-#{episodeNumber}-hibiki.mp3"
		dest = path.resolve config.destdir, filename

		# getCheck
		episodeId = _data.episode.video.id
		episodeDuration = _data.episode.video.duration
		checkURL = "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id="

		res = await got "#{checkURL}#{episodeId}", headers: config.headers

		if res.statusCode != 200
			throw Error "fetch check statusCode #{res.statusCode}"

		playlistURL = JSON.parse(''+res.body).playlist_url




		log "getPlaylist"
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
		playlistPath = path.resolve tempdir, "playlist.m3u8"

		fs.writeFileSync playlistPath,
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

				if url.parse(line).protocol == null # is it relative link
					srcURL = url.resolve url.resolve(tsaudioURL, '.'), line
				else
					srcURL = line

				audio.push
					url: srcURL
					dest: _dest

				tsStream.write _file

			else if line.slice(0, keyKey.length) == keyKey
				l = line.indexOf('"')
				r = line.indexOf('"', l+1)

				keys.push
					url: line[(l+1)...r]
					dest: _dest

				tsStream.write line[..l] + _file + line[r..]
			else
				tsStream.write line
			tsStream.write '\n'

		tsStream.end()



		# getKeys
		await promiseSerial keys.map (params) -> ->
			log "getKeys"
			res = await got params.url,
				headers:
					cookie: cookie,
					"User-Agent": config.headers["User-Agent"]

			if res.statusCode != 200
				throw Error "key statusCode #{res.statusCode}"

			if ''+res.rawBody == 'null'
				throw Error "key is null"

			fs.writeFileSync params.dest, res.rawBody

			if res.headers["set-cookie"]?
				keyCookie = res.headers["set-cookie"][0].split(';')[0]

			return

		log "resolve lock"
		# resolve launchQ lock
		resolveLock()

		# getAudio
		log "getAudio"
		await downloadQ.parallel audio.map (e) ->
			getFile.bind(null, e)

		tagsRequirement = []

		# getImage
		imageURL = _data.pc_image_url
		tagsRequirement.push downloadQ getFile.bind null,
			url: imageURL
			dest: imagePath# change to dest?

		# ffmpeg
		tagsRequirement.push ffmpegQ -> new Promise (resolve, reject) ->
			log "ffmpeg"

			child = require 'child_process'

			execFile = 'ffmpeg'
			if require('os').platform() == 'win32'
				execFile += '.exe'


			c = child.spawn(
				execFile,
				[ '-allowed_extensions','ALL'
					'-i', playlistPath.split('\\').join('/')
					'-vn'
					'-acodec', 'libmp3lame'
					'-q:a', '2',
					'-y'
					dest],
					stdio: 'ignore'
				)

			# c.stdout.on 'data', (d) -> console.log ''+d
			# c.stderr.on 'data', (d) -> console.log ''+d

			c.on 'error', (err) ->
				throw err

			c.on 'close', (code)->
				if (code == null or code == 0)
					resolve()
				else
					reject(Error "ffmpeg status #{code}")

		await Promise.all tagsRequirement
		do ->
			NodeID3 = require 'node-id3'

			title = [
				name,
				episodeNumber,
				_data.episode.name,
				_data.episode.program_name
			].join ' '

			artist = [].concat(_data.casts.map((e) ->
				arr = [e.name]
				if e.rool_name? then arr.push e.rool_name
				return arr
				)).join(' ')

			tags =
				title: title
				artist: artist
				album: _data.episode.program_name
				image: imagePath
				trackNumber: episodeNumber
				comment: _data.description

			if not NodeID3.update tags, dest
				throw Error "tags wasn't written"

			history.save historyKey
			log "complete"


	catch e
		log e
		resolveLock()
		return




init()