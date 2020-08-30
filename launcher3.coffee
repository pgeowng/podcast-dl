Q = require './Q'
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



defaultHeaders = require('./json/defaultHeaders.json')

searchWord = "#EXT-X-KEY:METHOD=AES-128,URI="

tasks = "get_program get_check get_image get_playlist get_tsaudio get_keys get_audio process_ffmpeg"

tasks = tasks.split(' ').map (e) -> require('./stages/' + e)

fns = []


for k in [0...(tasks.length)] by 1
	((k) ->
		fns[k] = (state) ->
			tasks[k](state, fns[k+1])
	)(k)

fns.push -> console.log 'end'


module.exports = fns[0]

# module.exports = (state) ->
# 	require('./stages/get_program') state, get_check

# get_check = (state) ->
# 	require('./stages/get_check') state, get_image

# get_image = (state) ->
# 	require('./stages/get_image') state, get_playlist

# get_playlist (state) ->
# 	require('./stages/get_playlist') state, get_playlist
