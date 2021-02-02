fs = require 'fs'
fse = require 'fs-extra'
path = require 'path'
url = require 'url'

config = require('./config.json')
Log = require('./lib/log')
Queue = require('./lib/Queue2')
history = require('./lib/history')

cwd = require('process').cwd()
sep = require('path').sep

got = require 'got'
stream = require 'stream'
promisify = require('util').promisify
pipeline = promisify stream.pipeline

stage = require('./lib/stage')
hibiki = require('./lib/hibiki')

common = require('./lib/common')
downloadJSON = common.downloadJSON


launchQ = Queue(1)
downloadQ = Queue(8)
ffmpegQ = Queue()

TEMPDIR = path.normalize config.tempdir
DESTDIR = path.normalize config.destdir

WORKDIR = path.normalize require('config').get('dest')


OPTIONS_XML = headers: "X-Requested-With": "XMLHttpRequest"

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

		# filtered = ['morfonica']

		promiseSerial filtered.map (e) ->
			loadProgram.bind(null, e)


	catch e
		console.log "get names error #{e}"




# DEBUG = false
DEBUG = true

loadProgram = (name) -> new Promise (resolveLock, reject) ->
	log = Log.add.bind null, name
	if (DEBUG) then log = (...a) -> console.log(name, ...a)

	# log = (a) -> console.log name, a
	try
		tempdir = path.resolve(WORKDIR, ".pod-hibiki-"+name) + sep
		fse.ensureDirSync(tempdir)
		# tempdir = fs.mkdtempSync(path.resolve(TEMPDIR, "#{name}-hibiki")) + sep
		imagePath = path.resolve tempdir, "image"

		# getProgram
		res = await got "https://vcms-api.hibiki-radio.jp/api/v1/programs/#{name}",
			headers: config.headers

		if res.statusCode != 200
			throw Error "getProgram status #{res.statusCode}"

		_data = JSON.parse(''+res.body)

		try
			data = new hibiki.DataWrap(_data)
		catch e
			throw e


		if history.isWas data.historyKey()
			throw Error "already downloaded"




		dest = path.resolve WORKDIR, data.filename()

		log "check"
		playlisturl = (await downloadJSON(data.checkurl(), null, OPTIONS_XML)).playlist_url
		playlistpath = path.resolve(tempdir, "playlist.m3u8")
		tsaudioname = "tsaudio.m3u8"

		log "playlist"
		{tsaudiourl, cookie} = await hibiki.playlist(playlisturl, playlistpath, tsaudioname)


		# getTsaudio

		log 'ts'
		result = await stage.ts(tsaudiourl, path.resolve(tempdir, tsaudioname))
		audioList = result.audioList.map (e) -> {url: e.url, dest: path.resolve(tempdir, e.dest) }
		keyList = result.keyList.map (e) -> {url: e.url, dest: path.resolve(tempdir, e.dest) }

		# getKeys
		log 'keys'
		await stage.keys keyList, cookie

		# getAudio
		log "getAudio"
		await downloadQ.parallel audioList.map (e) ->
			getFile.bind(null, e)

		tagsRequirement = []

		# getImage
		imageURL = _data.pc_image_url
		tagsRequirement.push downloadQ getFile.bind null,
			url: imageURL
			dest: imagePath# change to dest?

		log "resolve lock"
		# resolve launchQ lock
		resolveLock()

		# ffmpeg
		await stage.ffmpeg(playlistpath, dest)
		await Promise.all tagsRequirement
		do ->
			NodeID3 = require 'node-id3'


			if not NodeID3.update({...data.tags(), image: imagePath}, dest)
				throw Error "tags wasn't written"

			# history.save(data.historyKey())
			log "complete"

	catch e
		log e
		resolveLock()
		return




init()
