path = require 'path'
cwd = require('process').cwd()
got = require 'got'

url = "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1"
launcher = require('./launcher3')

config = require('./config.json')

# program = require('commander').program
# program.version('0.0.1')

# program
# .option '-d, --debug <name>', 'download only one file'
# #.option '-td, --tempdir <path>'

# program.parse process.argv

# if program.debug
# 	launcher
# 		name: program.debug
# 		destdir: destdir
# 		tempdir: path.resolve destdir, '../test'
# else
# 	got url, headers: require('./json/defaultHeaders.json')
# 	.then (res) ->
# 		data = JSON.parse res.body
# 		names = data.map (p) -> p.access_id
# 		names.filter (e) -> e != 'morfonica'
# 		for n in names
# 			launcher
# 				name: n
# 				destdir: destdir

got url, headers: config.headers
.then (res) ->
	names = JSON.parse(res.body).map (p) -> p.access_id
	filterNames = names.filter (e) -> config.ignore.indexOf(e) == -1

	for n in filterNames
		launcher
			name: n
			destdir: config.destdir