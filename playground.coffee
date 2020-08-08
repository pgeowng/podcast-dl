got = require 'got'

got "https://vcms-api.hibiki-radio.jp/api/v1/programs/rf-vg",
	headers:
	#	Host: "vcms-api.hibiki-radio.jp"
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0" # not important
	#	Accept: "application/json, text/plain, */*"
	#	"Accept-Language": "en-US,en;q=0.5"
	#	"Accept-Encoding": "gzip, deflate, br"
		"X-Requested-With": "XMLHttpRequest" # [!] important
	#	Origin: "https://hibiki-radio.jp"
	#	DNT: "1"
	#	Connection: "keep-alive"
	#	Referer: "https://hibiki-radio.jp/description/wts/detail"
	#	"If-None-Match": 'W/"5600e0196aaa138b8a2c4cd4fa3695cf"'
	#	"Cache-Control": "max-age=0"
.then (res) ->
	data = JSON.parse res.body
	videoId = data.episode.video.id

	got "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=#{videoId}",
		headers:
			Host: "vcms-api.hibiki-radio.jp"
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0"
		#	Accept: "application/json, text/plain, */*"
		#	"Accept-Language": "en-US,en;q=0.5"
		#	"Accept-Encoding": "gzip, deflate, br"
			"X-Requested-With": "XMLHttpRequest"
		#	Origin: "https://hibiki-radio.jp"
		#	DNT: 1
		#	Connection: "keep-alive"
		#	Referer: "https://hibiki-radio.jp/description/wts/detail"
		#	"If-None-Match": 'W/"0154a63960274587f3a51f9bc869c985"'
	.then (res) ->
		console.log res.statusCode
		console.log JSON.parse res.body

		playlistUrl = JSON.parse(res.body).playlist_url

		got playlistUrl
		.then (res) ->
			console.log res.statusCode
			tsAudioUrl = ((''+res.body).split('\n').filter (e) -> e.length > 0 and e[0] != '#')[0]

			cookie = res.headers["set-cookie"][0].split(';')[0]

			got tsAudioUrl
			.then (res) ->
				console.log res.statusCode
				file = (''+res.body).split('\n')

				searchWord = "#EXT-X-KEY:METHOD=AES-128,URI="
				keyURL = ''

				for l in file
					if l.length > searchWord.length
						if l.indexOf(searchWord) == 0
							left = l.indexOf('"')
							right = l.indexOf('"', left+1)
							keyURL = l[(left+1)...right]
							break

				if keyURL.length == 0
					console.log '[!] coundnt find key url'

				console.log keyURL

				got keyURL,
					headers:
						Host: "vms-api.hibiki-radio.jp"
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0"
						Accept: "*/*"
						"Accept-Language": "en-US,en;q=0.5"
						"Accept-Encoding": "gzip, deflate, br"
						Origin: "https://hibiki-radio.jp"
						DNT: 1
						Connection: "keep-alive"
						Referer: "https://hibiki-radio.jp/description/wts/detail"
						"cookie": cookie
				.then (res) ->
					console.log res.statusCode
					console.log res.rawBody


# fetch("https://vms-api.hibiki-radio.jp/api/v1/videos/datakey?kid=XySbM1OTeaiAP%2BvE9Yln5g%3D%3D", {
#   "headers": {
#     "accept": "*/*",
#     "accept-language": "en-US,en;q=0.9",
#     "sec-fetch-dest": "empty",
#     "sec-fetch-mode": "cors",
#     "sec-fetch-site": "same-site",
#     "cookie": "_ga=GA1.2.167499624.1596371805; _gid=GA1.2.563700116.1596371805; __gads=ID=f0eefeccfaf3a44f-221c1c5da7b60082:T=1596371815:RT=1596371815:S=ALNI_Ma7zbUaweRx9B2g0h15PLymrRDSmQ; _gat=1; _logica-vms_session=OWJMWDV3Ym1mM09tV2N3YlU3Zjl4VWs4SGh1cWFPN0RRSU91YWNrZW5KT1ZFTGI3UmxqRjVBSFM4OHUyMTE2ZGtqWVJZcjhDbVZmL0JqanY1OWdreDFxV1ZJNnBBNGFYRUNESStjNGR4Y0VSTk84M3haam5kWWFrelpLWUUxQkhQcVNwSDJkaFlwV1pSLzhDTWNvaHJ2Vk9PTUZkRlI1aGNzQSt5UjR4ZnRzPS0tdWR4K01oZ1MxZ1RQSTZjUkxUbXJFdz09--a635377e1a62df6de84c9f9b8533230e19a45d6e"
#   },
#   "referrer": "https://hibiki-radio.jp/description/rf-vg/detail",
#   "referrerPolicy": "no-referrer-when-downgrade",
#   "body": null,
#   "method": "GET",
#   "mode": "cors"
# });