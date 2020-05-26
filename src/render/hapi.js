'use strict'

const { L, S, Joi, iterateKeys } = require('../utils')

module.exports = models => {
  iterateKeys(models, (modelName, model) => {
    return L(`
      const DBM = mongoose.Model(${modelName})

      server.route('/${modelName}/{id}', {
        method: 'GET',
        handler: async (h, reply) => {
          const obj = await DBM.find({ _id: h.params.id })
        }
      })`)
  })
}
