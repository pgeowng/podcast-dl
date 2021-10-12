const fs = require('fs')
const history = require('../lib/history')

test('no history file', async () => {
  const h = history()

  expect(await h.check()).toBe(false)
  expect(await h.save()).toBe(false)
  console.log(process.cwd())
})

test('history readonly', async () => {
  const histfile = './tests/__history'
  const lockfile = './tests/__lockfile'

  // prepare
  if (fs.existsSync(histfile)) fs.rmSync(histfile)
  if (fs.existsSync(lockfile)) fs.rmSync(lockfile)

  const h = history(histfile, lockfile, false)
  expect(fs.existsSync(histfile)).toBe(true)
  expect(fs.existsSync(lockfile)).toBe(false)

  expect(await h.save([1, 2, 3])).toBe(false)
  expect('' + fs.readFileSync(histfile)).toBe('')

  expect(await h.check([])).toBe(false)
  expect(await h.check(['asfd'])).toBe(false)

  fs.writeFileSync(histfile, 'hello')
  expect(await h.check([])).toBe(false)
  expect(await h.check(['hello'])).toBe(true)
  expect(await h.save(['world'])).toBe(false)
  expect(await h.check(['world'])).toBe(false)

  if (fs.existsSync(histfile)) fs.rmSync(histfile)
  if (fs.existsSync(lockfile)) fs.rmSync(lockfile)
})

test('history readwrite', async () => {
  const histfile = './tests/__history'
  const lockfile = './tests/__lockfile'
  let p

  // prepare
  if (fs.existsSync(histfile)) fs.rmSync(histfile)
  if (fs.existsSync(lockfile)) fs.rmSync(lockfile)

  const h = history(histfile, lockfile)

  expect(await h.check([])).toBe(false)
  expect(await h.check(['hello'])).toBe(false)

  expect(await h.save(['hello'])).toBe(true)
  expect(await h.check(['hello'])).toBe(true)

  expect(await h.check(['world'])).toBe(false)
  expect(await h.save(['world'])).toBe(true)
  expect(await h.check(['world'])).toBe(true)

  if (fs.existsSync(histfile)) fs.rmSync(histfile)
  if (fs.existsSync(lockfile)) fs.rmSync(lockfile)
})
