const hibiki = require('./hibiki.js')

test('not array', () => {
  expect(() => hibiki._parseShows(32)).toThrow()
})