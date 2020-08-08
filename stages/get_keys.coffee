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
	index = 0

	launch = (link, filepath) ->
		Q ->
			got link, {
				headers:
					cookie: state.cookie
					"User-Agent": defaultHeaders["User-Agent"]
			}
			.then (res) ->
				if res.statusCode != 200
					console.log "[!] coundn't fetch key. res code strange", state.name, res.statusCode, res.body
					return

				if ''+res.rawBody == 'null'
					console.log "[!] key is null", state.name, res.statusCode, res.body

				fs.writeFileSync filepath, res.rawBody

				if res.headers["set-cookie"]?
					console.log "change cookie"
					state.cookie = res.headers["set-cookie"][0].split(';')[0]

				if index < state.keys.length
					launch.apply null, state.keys[index++]
				else
					setTimeout -> next(state)

	if state.keys.length > 0
		launch.apply null, state.keys[index++]
	else
		setTimeout -> next(state)

