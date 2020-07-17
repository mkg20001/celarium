'use strict'

const mongoose = require('mongoose')

module.exports = config => {
  const auditModel = {
    timestamp: { type: Date, required: true },
    user: { type: mongoose.ObjectID, required: true },
    model: { type: String, required: true },
    type: { type: String, required: true },
    object: { type: mongoose.ObjectID, required: true },
    targetKey: { type: String, required: true },
    operation: { type: String, required: true },
    parameter: { type: String, required: true } // kinda catch-all since we're storing both ids and actual parameters here
  }

  return {
    getModel: async modelName => mongoose.model(modelName),
    get: async (model, id) => {
      return model.findOne({ _id: id })
    },
    auditLog: {
      addEntry: async (user, model, type, object, targetKey, operation, parameter) => {
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
      }
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
}
