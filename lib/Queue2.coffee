module.exports = (limit = 1e9) ->
	queue = []
	ptr = 0
	working = 0

	if limit < 1 then limit = 1e9

	correctLimit = (value) ->
		if not value? or value != value
			return 1e9

		if value < 1
			return 0

		return value

	limit = correctLimit limit

	tryLaunch = ->
		d = Math.min(limit - working, queue.length - ptr)
		for i in [0...d]
			process.stdout.write '.'
			working++
			queue[ptr++]()
			.catch (e) ->
				console.log e
			.then ->
				working--
				setTimeout tryLaunch

	add = (fn) -> new Promise (res, rej) ->
		queue.push ->
			# p = fn()
			# console.log p
			fn()
			# p
			.then res
			.catch rej
			return Promise.resolve()

		setTimeout tryLaunch

	add.setLimit = (value) ->
		limit = correctLimit value

	add.parallel = (arr) -> new Promise (res, rej) ->
		wasError = false
		count = 0
		size = arr.length

		arr.forEach (fn) ->
			queue.push ->
				if wasError then return Promise.resolve()
				fn()
				.catch (e) ->
					wasError = true
					rej e
				.then ->
					if ++count == size
						res()

		setTimeout tryLaunch

	add.serial = (arr) -> new Promise (res, rej) ->
		wasError = false
		count = 0
		size = arr.length

		append = ->
			queue.push ->
				console.log 'executing', count
				if wasError then return Promise.resolve()
				arr[count]()
				.catch (e) ->
					wasError = true
					rej(e)
				.then ->
					console.log 'got'
					if not wasError
						if ++count == size
							res()
						else
							do append

		do append
		setTimeout tryLaunch

	return add