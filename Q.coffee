queue = []
ptr = 0
load = 0
max = 6

next = ->
	load--
	setTimeout process

tryLaunch = ->
	size = Math.min max-load, queue.length - ptr
	for i in [0...size]
		console.log '.'
		load++

		queue[ptr++]()
		.then next
		.catch (e) ->
			console.log e
			next()


process = (fn = null) ->
	if fn then queue.push fn
	tryLaunch()

module.exports = process