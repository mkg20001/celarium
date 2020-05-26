'use strict'

const { L, S, Joi, iterateKeys } = require('../utils')

module.exports = models => {
  iterateKeys(models, (modelName, model) => {
    return L(`new mongoose.Schema(${S(iterateKeys(model.attributes, (key, value) => {
      if (value.isNativeType) {
        return key.typeObj.mongoose.literalParameters(key.typeParameters) // TODO: add .typeParameters
      }

      if (value.isList) {
        if (value.isNativeType) {
          return L(`{ type: Array, item: ${S(key.typeObj.mongoose.literalParameters(key.typeParameters))} }`)
        }

        return L('{ type: Array, item: mongoose.ObjectID }') // TODO: db relations
      }
    }))})`)
  })
}
