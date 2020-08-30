Queue = require "./QueuePrototype"
q = new Queue 5

getNames = (cb) ->
	console.log 'getting names'
	setTimeout((-> cb(null, "asdf sadf re ww fs".split(' '))), 1000)

updateConfig = (err, res) ->
	console.log "updating config"
	console.log arguments

	for i in res
		setTimeout((((id) ->
			q.launch(
				fetchProgram.bind(null, id),
				processProgram.bind(null, id)
				)
			).bind(null, i)), 1000 * Math.random())
	setTimeout -> q.launch

fetchProgram = (id, cb) ->
	setTimeout((-> cb(null, {"id" : Math.floor(Math.random() * 1000)})), 1000*Math.random())

processProgram = (id, err, res) ->
	q.parallel [
			getImage.bind(null, "someurl", "resultpath")
			getPlaylist.bind(null, "someurl", "resultpaht")
		], (err, res) ->
			console.log res

getImage = (url, path, cb) ->
	setTimeout((-> cb(null, "loaded")), 1000)

getPlaylist = (url, path, cb) ->
	setTimeout((-> cb(null, "loaded")), 1000)

q.launch getNames, updateConfig
