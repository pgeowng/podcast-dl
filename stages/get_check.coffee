Q = require '../Q'
headers = require('../config.json').headers
got = require 'got'

module.exports = (state, next) -> Q ->
	got "" + state.episodeId, headers: headers
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch check -", state.name, state.episodeId, res.statusCode
			return

		state.playlistURL = JSON.parse(''+res.body).playlist_url
		next(state)