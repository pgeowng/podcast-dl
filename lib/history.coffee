fs = require "fs"

db = []

filepath = require('../config.json').historyFile

load = ->
	#console.log(fs.readFileSync('./history.tsv'))
	db = (''+fs.readFileSync(filepath)).split('\n')


module.exports.check = (entry) ->
	load()
	return not binary_check(entry)

module.exports.isWas = (entry) ->
	load()
	return binary_check(entry)


module.exports.save = (entry) ->
	db.push entry
	db.sort()
	fs.writeFileSync(filepath, db.join('\n'))

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


