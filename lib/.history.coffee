fs = require "fs"
# filepath = require('config').get('history')

db = []


module.exports = do () ->
	filepath = process.env.HISTORY_FILE

	load = ->
		#console.log(fs.readFileSync('./history.tsv'))
		db = (''+fs.readFileSync(filepath)).split('\n')

	check = (entry) ->
		load()
		return binary_check(entry)

	save = (entry) ->
		db.push entry
		db.sort()
		fs.writeFileSync(filepath, db.join('\n'))

	return {check, save}

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


