async = require('async')
hibiki = require('./main')

do ->
  console.log('fetching names...')
  names = await hibiki.listNames()
  names = names.slice(0, 5)
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

