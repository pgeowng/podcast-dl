got = require 'got'
# 11868
# 11867
id = 11867

got "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id="+id, headers: "X-Requested-With": "XMLHttpRequest"
.then (res) ->
	f = JSON.parse(''+res.body).playlist_url
	got f
	.then (res) ->
		console.log res.body