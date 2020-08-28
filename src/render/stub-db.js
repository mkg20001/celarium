'use strict'

const { L, S, Joi, iterateKeys, iterateKeysToArstr } = require('../utils')

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
  return L(`'use strict'

const ABS = require('celarium/src/abstract/stub-db')
const WRAP = require('celarium/src/abstract/database')

module.exports = (dbConfig) => {
  return WRAP(ABS(dbConfig, require('./joi')()))
}`)
}
