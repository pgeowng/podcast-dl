const err = require('./err.js')
const assure = {}

const _msg = (ctx, type, val) => `type of ${ctx} !== ${type}: ${val}`

assure.arr = (val, ctx) => {
  if (!Array.isArray(val))
    throw errors.new(_msg(ctx, 'array', val))
  return val
}

assure.arr1 = (val, ctx) => {
  if (!Array.isArray(val) && val.length < 1)
    throw errors.new(_msg(ctx, 'array(len > 1)', val))
  return val
}

assure.obj = (val, ctx) => {
  if (typeof data !== 'object' || data === null)
    throw errors.new(_msg(ctx, 'object', val))
  return val
}

assure.str = (val, ctx) => {
  if (typeof val !== 'string')
    throw errors.new(_msg(ctx, 'string', val))
  return val
}

assure.int = (val, ctx) => {
  if (!Number.isFinite(val))
    throw errors.new(_msg(ctx, 'int', val))
  return val
}

assure.bool = (val, ctx) => {
  if (typeof val !== 'boolean')
    throw errors.new(_msg(ctx, 'bool', val))
  return val
}

module.exports = assure