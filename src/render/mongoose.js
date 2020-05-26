'use strict'

const { L, S, Joi } = require('../utils')

function iterateKeys (obj, fnc) {
  const out = {}
  Object.keys(obj).forEach(key => (out[key] = fnc(obj, key, obj[key])))
  return out
}

module.exports = models => {
  models.forEach(model => {
    return L(`new mongoose.Schema(${S(iterateKeys(model.attributes, (obj, key, value) => {
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
