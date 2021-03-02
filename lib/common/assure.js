const classof = require('./classof')

// keys can be:
//   'some.string.1.null' => ['some', 'string', '1', 'null']
//   [2, null]
// #not provided - check data != null

// type == null: data != null
// otherwise: classof(data) === type

module.exports = (data, keys, type) => {
  if (keys == null) {
    if (data == null) throw Error('assure failed: data == null')
    return data
  }

  if (classof(keys) !== 'array') keys = ('' + keys).split('.')

  let i = 0
  try {
    for (; i < keys.length; i++) {
      data = data[keys[i]]
    }

    const c = classof(data)

    if (classof(type) === 'undefined') {
      if (data == null) {
        throw new Error(`assure failed: data == null in ${keys.join('.')}`)
      }
    } else if (c !== type) {
      throw new Error(`assure failed: ${c} !== ${type} in ${keys.join('.')}`)
    }

    return data
  } catch (e) {
    throw new Error(`assure failed: ${keys.slice(0, i + 1).join('.')} - ${e}`)
  }
}
