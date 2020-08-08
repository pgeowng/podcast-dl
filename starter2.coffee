path = require 'path'
cwd = require('process').cwd()
got = require 'got'

url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1"
destdir = path.resolve cwd, "complete"
launcher = require('./launcher3')

got url, headers: require('./json/defaultHeaders.json')
.then (res) ->
	data = JSON.parse res.body
	names = data.map (p) -> p.access_id

	# console.log.apply null, names

	for n in names
		launcher
			name: n
			destdir: destdir

# launcher
# 	name: "priconne_re"
# 	destdir: destdir
# 	tempdir: path.resolve destdir, '../test'