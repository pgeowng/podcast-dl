module.exports = () => {
  const was = {}

  const generate = () => {
    const num = Math.floor(Math.random() * (1 << 20)).toString(36)
    if (was[num]) return generate()
    was[num] = true
    return num
  }

  return generate
}
