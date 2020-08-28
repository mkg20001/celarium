'use strict'

const { L, S, Joi, iterateKeys } = require('../utils')

module.exports = config => {
  return L(`'use strict'

const { configValidate } = require('celarium/src/include')

module.exports = async (config) => {
  const { value, error } = configValidate.validate(config)

  if (error) {
    throw error
  }

  config = value

  const DBM = await (require('./db')(config.db))
  const API = await (require('./api')(config.api, DBM))

  return {
    DBM,
    API,
    async start () {
      await DBM.control.connect()
      await API.start()
    },
    async stop () {
      await DBM.control.disconnect()
      await API.stop()
    }
  }
}`)
}
