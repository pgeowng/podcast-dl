module.exports = (date) =>
  ('00' + date.getFullYear()).slice(-2) +
  ('00' + (date.getMonth() + 1)).slice(-2) +
  ('00' + date.getDate()).slice(-2)
