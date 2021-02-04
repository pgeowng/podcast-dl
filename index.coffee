async = require('async')
hibiki = require('./main')

do ->
  console.log('fetching names...')
  names = await hibiki.listNames()
  await async.eachSeries names, hibiki.launch