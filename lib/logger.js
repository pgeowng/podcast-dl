const error = (where, err, what) => {
  console.error('\n[error]', where)
  if (!!err) {
    console.error('[msg]', err.message)
  }
  if (what == null) return
  if (typeof what === 'object') {
    for (const key in what) {
      if (key[0] !== '$')
      console.error(key+':', what[key])
    }
  } else {
    console.error('what:', what)
  }
  return err
}

const msg = (...what) => {
  console.log('[msg]', ...what)
}

let status = {
  ep: '',
  stage: '',
  bg: 0,
}
let prevLength = 0


const statusline = (...props) => {
  process.stdout.write('\r'+Array(prevLength).fill(' ').join('') )
  prevLength = 0
  process.stdout.write('\r')

  if (status.bg) {
    const str = status.bg.toString()
    process.stdout.write('[bg: '+str+']')
    prevLength += str.length + 6 
  }

  if (status.ep) {
    process.stdout.write('['+status.ep+']')
    prevLength += status.ep.length + 2
  }

  if (status.stage) {
    process.stdout.write('['+status.stage+']')
    prevLength += status.stage.length + 2
  }

  if (props.length < 1) return
  for (let i = 0; i < (props.length-1); i++) {
    const str = String(props[i])
    process.stdout.write('['+str+']')
    prevLength += str.length + 2
  }

  const last = String(props[props.length-1])
  process.stdout.write(' ' + last)
  prevLength += last.length + 1

}

module.exports = {error, msg,  statusline, status}