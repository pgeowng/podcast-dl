Q = require '../../Q'
url = require 'url'
path = require 'path'
got = require 'got'
fs = require 'fs'

stream = require('stream');
promisify = require('util').promisify
pipeline = promisify stream.pipeline

defaultHeaders = require '../json/defaultHeaders.json'


module.exports = (state, next) ->
	count = 0

	launch = (link, filepath) ->
		Q ->
			pipeline(
				got.stream(link, headers: defaultHeaders),
				fs.createWriteStream(filepath))
			.then ->
				if ++count == state.audio.length
					setTimeout -> next(state)

	for a in state.audio
		launch.apply null, a