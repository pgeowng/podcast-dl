module.exports = (message, data = null) => {
  let result = {
    message,
  }
  if (data != null) result.data = data
  return result
}
