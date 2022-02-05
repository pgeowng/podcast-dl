const {parseShows} = require('./onsen.js')
const raw = require('./onsen.data.json')

test('onsen.parseShow', async () => {
  const result = parseShows(raw)
  expect(Array.isArray(result)).toBe(true)
})

test('not array', () => {
  expect(() => parseShows({})).toThrow()
})

test('empty directory name', () => {
  const raws = [{}]
  expect(() => parseShows(raws)).toThrow()
})

test('null performers', () => {
  const raws = [{directory_name: 'hi_there'}]
  expect(() => parseShows(raws)).toThrow()
})

test('performers doesn\'t contain name', () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [{hi: 'there'}]
  }]
  expect(() => parseShows(raws)).toThrow()
})

test('null contents', () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: []
  }]
  expect(() => parseShows(raws)).toThrow()
})
test("null guests", () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [],
    contents: [{}]
  }]
  expect(() => parseShows(raws)).toThrow()
})

test("guests doesn't contain name", () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [],
    contents: [{
      guests: [{hi: 'there'}]
    }]
  }]
  expect(() => parseShows(raws)).toThrow()
})

test("delivery date null", () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [],
    contents: [{
      guests: [],
      delivery_date: null
    }]
  }]
  const eps = parseShows(raws)
  expect(eps[0].date).toBe("000000")
})

test("delivery date month", () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [],
    contents: [{
      guests: [],
      delivery_date: "13/2"
    }]
  }]
  expect(() => parseShows(raws)).toThrow()
})

test("delivery date day", () => {
  const raws = [{
    directory_name: 'hi_there',
    performers: [],
    contents: [{
      guests: [],
      delivery_date: "1/33"
    }]
  }]
  expect(() => parseShows(raws)).toThrow()
})
