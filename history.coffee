fs = require "fs"

db = []

load = ->
	#console.log(fs.readFileSync('./history.tsv'))
	db = (''+fs.readFileSync('./history.tsv')).split('\n')


module.exports.check = (entry) ->
	load()
	return not binary_check(entry)

module.exports.save = (entry) ->
	db.push entry
	db.sort()
	fs.writeFileSync("./history.tsv", db.join('\n'))

binary_check = (str) ->
	left = 0
	right = db.length

	while left + 1 < right
		mid = left + (right - left) // 2

		if db[mid] > str
			right = mid
		else
			left = mid

	if left == right then return false
	else return db[left] == str


