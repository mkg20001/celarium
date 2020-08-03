'use strict'

const mongoose = require('mongoose')
const Boom = require('@hapi/boom')
const Joi = require('joi')

function mapErrorAndRethrow (error) {
  const [type] = String(error).split(':')
  switch (true) {
    case type === 'CastError': {
      throw Boom.badRequest(error)
    }

    default: {
      throw error
    }
  }
}

async function wrapRethrow (prom) {
  try {
    return await prom
  } catch (error) {
    mapErrorAndRethrow(error)
  }
}

function remap (i, modelName) {
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

  mongo layout:
    _id => id
    rest as-is
  */

  const o = {}

  for (const key in i) {
    if (key === '_id') {
      o.id = i._id
    } else {
      o[key] = i[key]
    }
  }

  o.model = modelName

  return o
}

function unmap (o) {
  const i = {}

  for (const key in o) {
    if (key === 'id') {
      i._id = o.id
    } else {
      o[key] = i[key]
    }
  }

  return o
}

function Pandemonica (data, db, model) {
  let hasBeenChanged = false
  let isNew = !data.id

  const goldenKeys = ['id', 'save']

  data.save = async () => {
    if (isNew) {
      isNew = false
      data.id = GenId()
      hasBeenChanged = true
    }

    if (hasBeenChanged) {
      return db.save(data.id, model, data)
    }
  }

  const proxy = new Proxy(data, {
    get (target, key) {
    },
    set (target, key, value) {
      if (goldenKeys.indexOf(key) !== -1) {
        throw new Error('Nope')
      }
    }
  })

  return proxy
}

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
    id: Joi.string().required()
  }).required(),
  model: Joi.string().required(),
  creator: Joi.any(),
  createdOn: Joi.date().required(),
  updater: Joi.any(),
  updatedOn: Joi.any()
}

module.exports = (config, joi) => {
  /*

  */

  function db () {
    return {
      save: (id, model, val) => {

      },
      get: (model, query) => {
        const res = {} // TODO: do actual querying

        return Pandemonica(res, db, model)
      },
      del: id => {

      }
    }
  }

  joi.audit = Joi.object({
    timestamp: Joi.date().required(),
    user: Joi.any().required(),
    model: Joi.string().required(),
    type: Joi.string().required(),
    object: Joi.string().required(), // id
    targetKey: Joi.string().required(),
    operation: Joi.string().required(),
    parameter: Joi.string().required(),
    ...baseModel
  })

  const S = {
    getModel: async modelName => {
      const m = joi[modelName]
      m.__name = modelName

      return m
    },
    get: async (model, id) => {
      return db.get(model, { id })
    },
    auditLog: {
      addEntry: async (user, model, type, object, targetKey, operation, parameter) => {
        // User added xyz to group n on object (user, model, type=acl, object, targetKey=n, operation=add, parameter=xyz) (type.operation=acl.add)
        // User remove xyz from list d on object i (user, model, type=modify, object, targetKey=d, operation=listRemove, parameter=xyz) (modify.listRemove)

        const obj = Pandemonica({
          timestamp: Date.now(),
          user,
          model,
          type,
          object,
          targetKey,
          operation,
          parameter
        }, db, Audit)

        await obj.save()

        return obj.id
      }
    },
    async makeElement (Model, contents, creator, parent) {
      const m = new Model(Object.assign({
        creator,
        createdOn: new Date(),
        acl: {}, // TODO: add initial
        parent
      }, contents))

      return remap(await wrapRethrow(m.save()))
    },
    async set (target, key, value, updater) {
      const model = await S.getModel(target.model)
      // TODO: use direct queries instead of magic object
      const self = await model.findOne({ _id: target.id })
      self.updater = updater
      self.updatedOn = new Date()
      self[key] = value

      return remap(await wrapRethrow(self.save()))
    },

    connect: () => {

    },
    disconnect: () => {

    }
  }

  const Audit = S.getModel('audit')

  return S
}
