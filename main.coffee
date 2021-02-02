fs = require 'fs'
fse = require 'fs-extra'
path = require 'path'
url = require 'url'

async = require('async')

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

{downloadJSON, downloadBinary} = require('./lib/common')


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




# DEBUG = false
DEBUG = true
# DEBUG_SKIP_AFTER_KEYS = true
DEBUG_SKIP_AFTER_KEYS = false

loadProgram = (name) ->
	log = Log.add.bind null, name
	if (DEBUG) then log = (...a) -> console.log(name, ...a)

	# log = (a) -> console.log name, a
	try
		tempdir = path.resolve(WORKDIR, ".pod-hibiki-"+name) + sep
		fse.ensureDirSync(tempdir)
		# tempdir = fs.mkdtempSync(path.resolve(TEMPDIR, "#{name}-hibiki")) + sep
		imagepath = path.resolve tempdir, "image"

		# getProgram
		_data = await downloadJSON("https://vcms-api.hibiki-radio.jp/api/v1/programs/#{name}", null, OPTIONS_XML)
		data = new hibiki.DataWrap(_data)


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

		if (DEBUG_SKIP_AFTER_KEYS)
			return
		# getAudio
		log "audio"
		await downloadQ.parallel audioList.map (e) ->
			getFile.bind(null, e)


		log 'ffmpeg'
		muxPromise = stage.ffmpeg(playlistpath, dest)

		# getImage

		log 'image start'
		await downloadBinary data.imageurl(), imagepath
		log 'image done'
		muxPromise.then ->
			log 'tags'
			await stage.tags({...data.tags(), image: imagepath}, dest)
			history.save(data.historyKey())

	catch e
		log e

	return


launch = (names) ->
	async.eachSeries names, loadProgram,

main = ->
	try
		console.log 'fetching names...'


		json = await downloadJSON("https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1",null, OPTIONS_XML)

		names = json.map((p) -> p.access_id).filter (e) -> config.ignore.indexOf(e) == -1

		# filtered = ['morfonica']

		launch(names)
	catch e
		console.log "get names error #{e}"

# main()

launch(['morfonica'])