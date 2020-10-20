'use strict'

// const Boom = require('@hapi/boom')
const Joi = require('joi')

/*

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

const baseModel = {
  id: Joi.string().required(),
  // acl
  parent: Joi.object({
    model: Joi.string().required(),
    id: Joi.string().required(),
  }).required(),
  model: Joi.string().required(),
  creator: Joi.any(),
  createdOn: Joi.date().required(),
  updater: Joi.any(),
  updatedOn: Joi.any(),
}

module.exports = (config, joi) => {
  /*

  */

  const db = require('./stub-db-mem')()

  joi.audit = Joi.object({
    timestamp: Joi.date().required(),
    user: Joi.any().required(),
    model: Joi.string().required(),
    type: Joi.string().required(),
    object: Joi.string().required(), // id
    targetKey: Joi.string().required(),
    operation: Joi.string().required(),
    parameter: Joi.string().required(),
    ...baseModel,
  })

  const S = {
    getModel: async modelName => {
      const m = joi[modelName]
      m.__name = modelName

      return m
    },

    addAuditEntry: async (user, model, type, object, targetKey, operation, parameter) => {
      // User added xyz to group n on object (user, model, type=acl, object, targetKey=n, operation=add, parameter=xyz) (type.operation=acl.add)
      // User remove xyz from list d on object i (user, model, type=modify, object, targetKey=d, operation=listRemove, parameter=xyz) (modify.listRemove)

      const data = {
        timestamp: Date.now(),
        user,
        model,
        type,
        object,
        targetKey,
        operation,
        parameter,
      }

      return db.table(model.__name).create(data)
    },

    create(model, contents) {
      return db.table(model.__name).create(contents)
    },
    get(model, query) {
      return db.table(model.__name).get(query.id)
    },
    set(model, id, kv) {
      const table = db.table(model.__name)
      return table.store(id, Object.assign(table.get(id), kv))
    },
    del(model, id) {
      return db.table(model.__name).del(id)
    },

    connect: () => {

    },
    disconnect: () => {

    },
  }

  // const Audit = S.getModel('audit')

  return S
}
