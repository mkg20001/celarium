'use strict'

const def = {
  api: {
    host: '127.0.0.1',
    port: 3344
  },
  db: {
    url: 'mongodb://localhost:27017/testcelarium'
  }
}

async function main () {
  const { API: api, DBM: db, start, stop } = await (require('./base')(def))

  await api.start()
}

main().then(console.log, console.error)
