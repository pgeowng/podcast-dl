clear = ->
	console.log '\u001b[2J'

names = {}

add = (name, status) ->
	if not names[name]?
		names[name] = {}

	names[name] = status
	print()

print = ->
	obj = {}
	k = Object.keys names
	v = Object.values names
	size = k.length

	for i in [0...size]
		if not obj[v[i]]?
			obj[v[i]] = {}

		obj[v[i]][k[i]] = true

	clear()
	Object.keys(obj).forEach (e) ->
		console.log e, Object.keys(obj[e])

module.exports =
	add: add