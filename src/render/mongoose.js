'use strict'

const { L, S, Joi, iterateKeys, iterateKeysToArray } = require('../utils')

module.exports = models => {
  const schemas = iterateKeysToArray(models, (modelName, model) => {
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
  
  return L(`'use strict'

const ABS = require('celarium/src/abstract/mongoose')
const mongoose = require('mongoose')

module.exports = (dbConfig) => {
  ${S(schemas)}

  return ABS(dbConfig)
}`)
}
