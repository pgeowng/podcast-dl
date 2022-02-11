const err = {}

err.new = (message) => new Error(message)
err.wrap = (error, message, extra=null) => {
  return {
    error,
    message,
    extra
  }
}

module.exports = err