'use strict'

const { L, S, Joi, iterateKeys, iterateKeysToArstr } = require('../utils')

module.exports = models => {
  const mModels = iterateKeysToArstr(models, (modelName, model) => {
    const schema = L(`new mongoose.Schema(${S(Object.assign(iterateKeys(model.attributes, (attrName, attr) => {
      if (attr.isNativeType) {
        return attr.typeObj.mongoose.literalParameters(attr.typeParameters) // TODO: add .typeParameters
      }

      if (attr.isList) {
        if (attr.isNativeType) {
          return L(`{ type: Array, item: ${S(attr.typeObj.mongoose.literalParameters(attr.typeParameters))} }`)
        }

        return L('{ type: Array, item: mongoose.ObjectId }') // TODO: db relations
      }
    }) /* TODO: ACLs */, { parent: L('{ type: mongoose.ObjectId }') }))})`)

    return L(`mongoose.model(${S(modelName)}, ${S(schema)})`)
  })

  return L(`'use strict'

const ABS = require('celarium/src/abstract/mongoose')
const mongoose = require('mongoose')

module.exports = (dbConfig) => {
  ${S(mModels)}

  return ABS(dbConfig)
}`)
}
