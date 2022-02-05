const transformKeys = require('./keys')

test('correct empty', () => {
  const obj = [] 
  const [keys] = transformKeys(obj)
  expect(keys.length === 0).toBe(true)
})

test('correct one', () => {
  const obj = [{key: 'dgs', dest:'gs'}] 

  const [keys] = transformKeys(obj)
  expect(keys.length === 1).toBe(true)
})

test('correct two', () => {
  const obj = [{key: 'dgs', dest:'gs'}, {key:'eg', dest: 'fds'}] 

  const [keys] = transformKeys(obj)
  expect(keys.length === 2).toBe(true)
})

test('null key', () => {
  const obj = [{key: 'null', dest: 'valid'}]
  expect(() => transformKeys(obj)).toThrow()
})

test('bad dest', () => {
  const obj = [{key: 'sadga'}]
  expect(() => transformKeys(obj)).toThrow()
})