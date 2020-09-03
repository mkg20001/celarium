'use strict'

function Pandemonica (bare, db, model) { // our new magic object
  let isNew = !bare.id

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

module.exports = (abs, ACL) => {
  const modelCache = {}

  async function resolveModel (modelName) {
    if (!modelCache[modelName]) {
      modelCache[modelName] = abs.getModel(modelName)
    }

    return await modelCache[modelName]
  }

  const DBM = {
    db: {
      // TODO: validate all inputs using joi?
      async create (modelName, newContents, creator, parent) {
        const bare = Object.assign(Object.assign({}, newContents), {
          creator,
          createdOn: new Date(),
          acl: {}, // TODO: add initial
          parent
        })

        const out = Pandemonica(bare, abs, await resolveModel(modelName))
        await out.save()
        return out
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
    validateAcls: async (obj, user, modelName, attrName, action, listAction, listNextId) => {
      return validateAcls(obj, user, modelName, await resolveModel(modelName), attrName, action, listAction, listNextId)
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
  }

  const { validateAcls } = ACL(DBM)

  return DBM
}
