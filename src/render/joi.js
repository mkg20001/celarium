'use strict'

const {L, S, iterateKeys} = require('../utils')
const FJoi = require('fake-joi')

module.exports = models => {
  const schemas = iterateKeys(models, (modelName, model) => {
    return iterateKeys(model.attributes, (attrName, attr) => {
      if (attr.isNativeType) {
        return attr.typeObj.joi.literalParameters(attr.typeParameters)
      }

      if (attr.isList) {
        // TODO: properly handle lists (in some req/res missing, in other needs fill)
        return L(FJoi.array()._)
        /* if (attr.isNativeType) {
          return L(`{ type: Array, item: ${S(attr.typeObj.mongoose.literalParameters(attr.typeParameters))} }`)
        }

        return L('{ type: Array, item: mongoose.ObjectID }') // TODO: db relations */
      }
    })
  })

  return L(`'use strict'

const Joi = require('@hapi/joi')

module.exports = () => {
  return ${S(schemas)}
}`)
}
