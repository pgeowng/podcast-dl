const Episode = require('./Episode')

test('valid', () => {
  const ep = new Episode({
    provider: 'onsen',
    date: '200413',
    showName: 'show_name',
    showTitle: 'show title',
    title: 'episode title',
    performers: ["performer"],
    guests: [],
    tags: {premium: true, trial: false},
    imageUrl: null,
    hooks: {
      preload: async () => {},
    },
    playlistUrl: null
  })

  expect(ep.provider).toBe('onsen')
  expect(ep.date).toBe('200413')
  expect(ep.showName).toBe('show_name')
  expect(ep.showTitle).toBe('show title')
  expect(ep.title).toBe('episode title')
  expect(ep.performers).toContain('performer')
  expect(ep.performers.length).toBe(1)
  expect(ep.guests.length).toBe(0)
  expect(ep.tags.premium).toBeTruthy()
  expect(ep.tags.trial).toBeFalsy()
  expect(ep.imageUrl).toBeNull()
  expect(ep.hooks).toBeDefined()
  expect(ep.hooks.preload).toBeDefined()
  expect(ep.playlistUrl).toBeNull()
})

test('no show name', () => {
  const ep = new Episode({
    showName: 'show_name',
  })

  expect(ep.provider).toBe('unknown')
  expect(ep.date).toBe('000000')
  expect(ep.showName).toBe('show_name')
  expect(ep.showTitle).toBe('')
  expect(ep.title).toBe('')
  expect(ep.performers.length).toBe(0)
  expect(ep.guests.length).toBe(0)
  expect(ep.tags.premium).toBeFalsy()
  expect(ep.tags.trial).toBeFalsy()
  expect(ep.imageUrl).toBeNull()
  expect(ep.hooks).toBeDefined()
  expect(ep.playlistUrl).toBeNull()
})