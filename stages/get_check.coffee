Q = require '../../Q'
defaultHeaders = require '../json/defaultHeaders.json'
got = require 'got'

module.exports = (state, next) -> Q ->
	got "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=" + state.episodeId, headers: defaultHeaders
	.then (res) ->
		if res.statusCode != 200
			console.log "[!] coundn't fetch check -", state.name, state.episodeId, res.statusCode
			return

		state.playlistURL = JSON.parse(''+res.body).playlist_url
		next(state)