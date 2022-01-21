module.exports = (o) =>
  Object.prototype.toString.call(o).slice(8, -1).toLowerCase()
