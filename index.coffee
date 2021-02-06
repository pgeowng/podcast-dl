async = require('async')

module.exports = (options) ->
  hibiki = require('./main')(options)
  console.log('fetching names...')
  names = await hibiki.listNames()
  items = await async.mapSeries names, async.reflect(hibiki.launch)

  items = items.filter (e, i) ->
    if e.error?
      console.log(names[i], e.error)

    return !e.error?

  items = items.map (e) -> e.value

  items.sort (a, b) -> a.date() - b.date()
  # items.forEach (e) -> console.log e.name(), e.date()

  await async.eachSeries items, (e) ->
    await e.load()
      .catch((err) -> console.error(e.name(), err))

