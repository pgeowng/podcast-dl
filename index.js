require('dotenv').config()
const async = require('async')

const nameMap = {
  // 'hibiki':
  onsen: require('./lib/onsen'),
}

const providers = Object.keys(nameMap)
;(async () => {
  let providerName = process.argv[2]
  if (providers.indexOf(providerName) === -1) {
    console.log(
      'Unknown provider: ',
      providerName,
      ' - only supports:',
      ...providers
    )
    process.exit()
  }

  const mmap = {
    hibiki: 'HIBIKI_IGNORE_NAMES',
    onsen: 'ONSEN_IGNORE_NAMES',
  }

  process.env['IGNORE_NAMES'] = process.env[mmap[providerName]]

  const provider = nameMap[providerName]({}) // FIXME

  process.stdout.write('fetching names...')
  let names = await provider.loadList() //.slice(0, 5)

  console.log(' ', names.length, 'entries')
  let items = await async.mapSeries(names, async.reflect(provider.check))

  items = items.filter(function (e, i) {
    if (e.error != null) {
      console.log(names[i], e.error)
    }
    return e.error == null
  })
  console.log('loading', items.length, 'items...')

  items = items.map(function (e) {
    return e.value
  })

  items.sort(function (a, b) {
    return a.date() - b.date()
  })

  return await async.eachSeries(items, async function (e) {
    return await e.load().catch(function (err) {
      return console.error('[load]', e.name(), err)
    })
  })
})()
