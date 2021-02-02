fs = require 'fs'
fse = require 'fs-extra'
path = require 'path'
url = require 'url'

async = require('async')

Log = require('./lib/log')
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


LIMIT_AUDIO = 6
config = require('config')
WORKDIR = path.normalize config.get('dest')
IGNORE_NAMES = config.get('ignore').split(' ')

OPTIONS_XML = headers: "X-Requested-With": "XMLHttpRequest"

# DEBUG = false
DEBUG = true
# DEBUG_SKIP_AFTER_KEYS = true
DEBUG_SKIP_AFTER_KEYS = false

loadProgram = (name) ->
	log = Log.add.bind null, name
	if (DEBUG) then log = (...a) -> console.log(name, ...a)

	try
		log 'program'
		_data = await downloadJSON("https://vcms-api.hibiki-radio.jp/api/v1/programs/#{name}", null, OPTIONS_XML)
		data = new hibiki.DataWrap(_data)

		if history.isWas data.historyKey()
			throw Error "already downloaded"

		tempdir = path.resolve(WORKDIR, ".pod-hibiki-"+name) + sep
		fse.ensureDirSync(tempdir)
		imagepath = path.resolve tempdir, "image"
		dest = path.resolve WORKDIR, data.filename()

		log "check"
		playlisturl = (await downloadJSON(data.checkurl(), null, OPTIONS_XML)).playlist_url
		playlistpath = path.resolve(tempdir, "playlist.m3u8")
		tsaudioname = "tsaudio.m3u8"

		log "playlist"
		{tsaudiourl, cookie} = await hibiki.playlist(playlisturl, playlistpath, tsaudioname)


		log 'ts'
		result = await stage.ts(tsaudiourl, path.resolve(tempdir, tsaudioname))
		audioList = result.audioList.map (e) -> {url: e.url, dest: path.resolve(tempdir, e.dest) }
		keyList = result.keyList.map (e) -> {url: e.url, dest: path.resolve(tempdir, e.dest) }

		log 'keys'
		await stage.keys keyList, cookie

		if (DEBUG_SKIP_AFTER_KEYS) then return

		log "audio"
		await async.eachLimit audioList, LIMIT_AUDIO, (params) ->
			await downloadBinary params.url, params.dest

		log 'ffmpeg'
		muxPromise = stage.ffmpeg(playlistpath, dest)

		log 'image start'
		await downloadBinary data.imageurl(), imagepath
		log 'image done'

		muxPromise.then ->
			log 'tags'
			await stage.tags({...data.tags(), image: imagepath}, dest)
			log 'complete'
			# history.save(data.historyKey())
		.catch (e) ->
			log 'tags error ' + e

	catch e
		log e

	return


launch = (names) ->
	async.eachSeries names, loadProgram,

main = ->
	try
		console.log 'fetching names...'

		json = await downloadJSON("https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1",null, OPTIONS_XML)
		names = json.map((p) -> p.access_id).filter (e) -> IGNORE_NAMES.indexOf(e) == -1

		launch(names)
	catch e
		console.log "get names error #{e}"

# main()

launch(['morfonica'])