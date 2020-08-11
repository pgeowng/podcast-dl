Q = require '../Q'
path = require "path"
fs = require 'fs'
got = require 'got'

stream = require('stream');
promisify = require('util').promisify
pipeline = promisify stream.pipeline

module.exports = (state, next) -> Q ->
	state.imagePath = path.resolve state.tempdir, "image.png"
	pipeline(
		got.stream(state._data.pc_image_url),
		fs.createWriteStream(state.imagePath))
	.then ->
		next(state)