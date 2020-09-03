'use strict'

const Boom = require('@hapi/boom')
const GenId = () => String(Math.random()).replace(/[^1-9]/gmi, '').substr(0, 6)

module.exports = () => {
  const Storage = {}

  return {
    table: name => {
      if (!Storage[name]) Storage[name] = {}
      const storage = Storage[name]

      return {
        store: (id, data) => {
          storage[id] = data
        },
        create: data => {
          const id = GenId()
          storage[id] = data
          return id
        },
        get: id => {
          if (!storage[id]) {
            throw Boom.notFound(`Element ${id} does not exist`)
          }

          return storage[id]
        },
        del: id => {
          delete storage[id]
        }
      }
    }
  }
}
