'use strict'

const { L, S, Joi, iterateKeys } = require('../utils')

module.exports = models => {
  return iterateKeys(models, (modelName, model) => {
    return L(`new mongoose.Schema(${S(Object.assign(iterateKeys(model.attributes, (attrName, attr) => {
      if (attr.isNativeType) {
        return attr.typeObj.mongoose.literalParameters(attr.typeParameters) // TODO: add .typeParameters
      }

      if (attr.isList) {
        if (attr.isNativeType) {
          return L(`{ type: Array, item: ${S(attr.typeObj.mongoose.literalParameters(attr.typeParameters))} }`)
        }

        return L('{ type: Array, item: mongoose.ObjectID }') // TODO: db relations
      }
    }) /* TODO: ACLs */, { parent: L('{ type: mongoose.ObjectID }') }))})`)
  })
}
