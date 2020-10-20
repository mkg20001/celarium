'use strict'

const {L, S, Joi, iterateKeys, iterateKeysToArstr} = require('../utils')

/*

add props

normalized layout:
  id: id property
  acl: object containing arrays
    [key]: array for acl "key" containing flat-acls ({ wildcard?, not?, user: ID })
  [key]: the usual kv
  parent: id of parent, if available (note: { model, id } - not just id)
  model: modelName (virtual)
  creator: ID of creator if avail
  createdOn: timestamp of creation
  updater: ID of last user who updated element
  updatedOn: timestamp of update

*/

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
    }) /* TODO: ACLs */, {parent: {model: L('{ type: String }'), id: L('{ type: mongoose.ObjectId }')}}))})`)

    return L(`mongoose.model(${S(modelName)}, ${S(schema)})`)
  })

  return L(`'use strict'

const ABS = require('celarium/src/abstract/mongoose')
const WRAP = require('celarium/src/abstract/database')
const mongoose = require('mongoose')

module.exports = (dbConfig, ACL) => {
  ${S(mModels)}

  return WRAP(ABS(dbConfig), ACL)
}`)
}
