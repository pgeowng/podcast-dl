path = require 'path'
cwd = require('process').cwd()
got = require 'got'

testName = ""

# url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1"
destdir = path.resolve cwd, "complete"
launcher = require('./launcher3')

launcher
	name: "Afterglow"
	destdir: destdir
	tempdir: path.resolve destdir, '../test'

# got url, headers: require('./json/defaultHeaders.json')
# .then (res) ->
#   data = JSON.parse res.body
#   names = data.map (p) -> p.access_id

#   # console.log.apply null, names

#   for n in names
#     launcher
#       name: n
#       destdir: destdir

