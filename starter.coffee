got = require 'got'
launcher = require './launcher2.coffee'
sep = require('path').sep
cwd = require('process').cwd()

day = 5
dict = 'mon tue wed thu fri satsun'.split ' '

# resultPrefix = cwd + sep + "complete#{sep}#{day}-#{dict[day]}" + sep
# console.log resultPrefix
defaultHeaders =
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0"
	"X-Requested-With": "XMLHttpRequest"

# url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?day_of_week=#{dict[day]}&limit=99&page=1"
# console.log url

url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1"
resultPrefix = cwd + sep + "complete" + sep

got url, headers: defaultHeaders
.then (res) ->
	data = JSON.parse res.body
	names = data.map (p) -> p.access_id
	console.log names.length
	for n in names
		console.log resultPrefix
		launcher n, resultPrefix