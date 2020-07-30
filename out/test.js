'use strict'

const def = {
  api: {
    host: '127.0.0.1',
    port: 7452,
    getUser: () => 1
  },
  db: {
    url: 'mongodb://localhost:27017/testcelarium'
  }
}

async function main () {
  const { API: api, DBM: db, start, stop } = await (require('./base')(def))

  const { _hapi: server } = api

  await server.register({
    plugin: require('hapi-pino'),
    options: { name: 'celarium-test' }
  })

  await start()

  const root = await db.makeElement(await db.getModel('board'), {
    name: 'Burd', // Board written wrong intentionally
    description: 'The Test Burd'
  })

  console.log(root)

  process.on('SIGINT', () => {
    stop()
  })

  process.on('SIGTERM', () => {
    stop()
  })
}

main().then(console.log, console.error)
