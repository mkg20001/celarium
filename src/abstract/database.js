'use strict'

function Pandemonica (bare, db, model) { // our new magic object
  const isNew = !bare.id

  const goldenKeys = ['id', 'save']

  let diff = isNew ? bare : {}

  bare.save = async updater => {
    if (isNew) {
      bare.id = await db.create(model, diff)
      isNew = false
    } else {
      await db.set(model, bare.id, diff)
    }

    diff = {}
  }

  const proxy = new Proxy(bare, {
    get (target, key) {
      return target[key]
    },
    set (target, key, value) {
      if (goldenKeys.indexOf(key) !== -1) {
        throw new Error('Nope')
      }

      // TODO: prevalidate with joi

      target[key] = value
      diff[key] = value
    }
  })

  return proxy
}

module.exports = abs => {
  const modelCache = {}

  async function resolveModel (modelName) {
    if (!modelCache[modelName]) {
      modelCache[modelName] = abs.getModel(modelName)
    }

    return await modelCache[modelName]
  }

  return {
    db: {
      // TODO: validate all inputs using joi?
      async create (modelName, newContents, creator, parent) {
        const bare = {
          creator,
          createdOn: new Date(),
          acl: {}, // TODO: add initial
          parent
        }

        return Pandemonica(bare, abs, await resolveModel(modelName))
      },
      async getById (modelName, id) {
        const res = await abs.get(await resolveModel(modelName), { id })

        return Pandemonica(res, abs, await resolveModel(modelName))
      },
      async setById (modelName, id, kv, updater) {
        kv.updater = updater
        kv.updatedOn = new Date()

        return abs.set(await resolveModel(modelName), id, kv)
      },
      async delById (modelName, id, deleter, softDelete = true) {
        if (softDelete) {
          await abs.set(await resolveModel(modelName), id, {
            deleted: true,
            deleter,
            deletedOn: new Date()
          })
        } else {
          return abs.del(await resolveModel(modelName), id)
        }
      },
      async query (modelName, parent, query) {

      }
    },
    auditLog: {
      // TODO: this should be it's own model, appended compile time, then referenced here
      addEntry (user, model, type, object, targetKey, operation, parameter) {
        return abs.addAuditEntry(user, model, type, object, targetKey, operation, parameter)
      }
    },
    control: {
      connect: abs.connect,
      disconnect: abs.disconnect
    },
    _: abs

    /*    getModelasync modelName => {
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
          const el = Pandemonica(Object.assign({
            creator,
            createdOn: new Date(),
            acl: {}, // TODO: add initial
            parent
          }, contents), db, Model)

          await el.save()

          return el
        },
        async set (target, key, value, updater) {
          const model = await S.getModel(target.model)
          // TODO: use direct queries instead of magic object
          const self = await model.findOne({ _id: target.id })
          self.updater = updater
          self.updatedOn = new Date()
          self[key] = value

          return self.save()
        },

        connect: () => {

        },
        disconnect: () => {

        }
      } */
  }
}
