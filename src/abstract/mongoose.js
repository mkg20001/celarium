'use strict'

const mongoose = require('mongoose')
const Boom = require('@hapi/boom')

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

module.exports = config => {
  const auditModel = {
    timestamp: { type: Date, required: true },
    user: { type: mongoose.ObjectId, required: true },
    model: { type: String, required: true },
    type: { type: String, required: true },
    object: { type: mongoose.ObjectId, required: true },
    targetKey: { type: String, required: true },
    operation: { type: String, required: true },
    parameter: { type: String, required: true } // kinda catch-all since we're storing both ids and actual parameters here
  }

  const Audit = mongoose.model('audit', new mongoose.Schema(auditModel))

  const S = {
    getModel: async modelName => {
      const m = mongoose.model(modelName)
      m.__name = modelName

      return m
    },
    get: async (model, id) => {
      return remap(await wrapRethrow(model.findOne({ _id: id }), model.__name))
    },
    async addAuditEntry (user, model, type, object, targetKey, operation, parameter) {
      // User added xyz to group n on object (user, model, type=acl, object, targetKey=n, operation=add, parameter=xyz) (type.operation=acl.add)
      // User remove xyz from list d on object i (user, model, type=modify, object, targetKey=d, operation=listRemove, parameter=xyz) (modify.listRemove)

      const obj = new Audit({
        timestamp: Date.now(),
        user,
        model,
        type,
        object,
        targetKey,
        operation,
        parameter
      })

      const res = await obj.save()

      return res._id
    },
    async create (Model, contents, creator, parent) {
      const m = new Model(contents)

      return remap(await wrapRethrow(m.save()))
    },
    async set (model, targetId, updateKV) {
      // TODO: use direct queries instead of magic object
      const self = await model.findOne({ _id: targetId })

      for (const key in updateKV) { // eslint-disable-line guard-for-in
        self[key] = updateKV[key]
      }

      return remap(await wrapRethrow(self.save()))
    },
    async del (model, id) {
      // TODO: implement
    },

    connect: () => {
      return mongoose.connect(config.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    },
    disconnect: () => {
      return mongoose.disconnect()
    }
  }

  return S
}
