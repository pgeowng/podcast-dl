queue = []
ptr = 0
load = 0
max = 6

next = ->
	load--
	setTimeout process

process = (fn = null) ->
	if fn
		queue.push fn

	if load < max and ptr < queue.length
		console.log ptr, queue.length
		load++

		queue[ptr++]()
		.then next
		.catch (e) ->
			console.log e
			next()

module.exports = process