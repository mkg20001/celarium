'use strict'

const { L, S, Joi, iterateKeysToArstr } = require('../utils')

// const Stack = require('celarium/src/acl/stack')

module.exports = models => {
  const routes = iterateKeysToArstr(models, (modelName, model) => {
    return L(`
      const ${modelName} = DBM.getModel(${S(modelName)})

      server.route({
        method: 'GET',
        path: '/${modelName}/{id}',
        // TODO: validate request
        handler: async (h, reply) => {
          const obj = await DBM.find(${modelName}, h.params.id)
          const stack = Stack(obj, DBM)
          // TODO: validate access control (really important)
          if (accessLog) {
            // TODO: recursivly for every key?!
            await DBM.auditLog(getUser(), ${S(modelName)}, "access", h.params.id, "*", null, null) // (user, model, type, object, targetKey, operation, parameter)
          }
        }
      })

      server.route({ // modify the object (should do all the checks per-key - should lists be modifiable here (append)? prob not...)
        method: 'PATCH',
        path: '/${modelName}/{id}',
        // TODO: validate request
        handler: async (h, reply) => {
          const obj = await DBM.find(${modelName}, h.params.id)
          const stack = Stack(obj, DBM)
          // TODO: validate access control (really important)
          // TODO: recursive audit log
        }
      })

      ${S(iterateKeysToArstr(model.attributes, (attrName, attr) => {
        if (attr.isList) {
          return L(`
          server.route({ // this gets all the objects in a list, with pagination etc...
            method: 'GET',
            path: '/${modelName}/{id}/${attrName}',
            // TODO: validate request
            // TODO: pagination, filtering...
            handler: async (h, reply) => {
              const obj = await DBM.find(h.params.id)
              const stack = Stack(obj, DBM)
              // TODO: validate access control (really important)
              if (accessLog) {
                await DBM.auditLog(getUser(), ${S(modelName)}, "access", h.params.id, ${S(attrName)}, null, null) // (user, model, type, object, targetKey, operation, parameter)
              }
            }
          })

          server.route({ // this accepts either an object to create (for non-sym) or an id to append (for sym). for non-sym parent is set to the current object id
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}/append',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.find(h.params.id)
              const stack = Stack(obj, DBM)
              // TODO: validate access control (really important)
              await DBM.auditLog(getUser(), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}, "add", newId) // (user, model, type, object, targetKey, operation, parameter)
            }
          })

          server.route({ // this accepts an id to remove. for non-sym it also removes the object from db (or rather disassociates it ala soft-delete - but we should leave this to the user FIXME)
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}/remove',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.find(h.params.id)
              const stack = Stack(obj, DBM)
              // TODO: validate access control (really important)
              // TODO: audit log
              await DBM.auditLog(getUser(), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}, "remove", oldId) // (user, model, type, object, targetKey, operation, parameter)
            }
          })
          `)
        }
          return L(`
          server.route({ // this accepts a new value for a key
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.find(h.params.id)
              // TODO: validate access control (really important)
              // TODO: audit log
              await DBM.auditLog(getUser(), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}) // (user, model, type, object, targetKey, operation, parameter)
            }
          })
          `)
      }))}`)
  })

  return L(`'use strict'

const Hapi = require('@hapi/hapi')

module.exports = (config, DBM) => {
  const server = new Hapi.Server({
    host: config.host,
    port: config.port
  })

  ${S(routes)}

  return {
    start: () => server.start(),
    stop: () => server.stop(),
    _hapi: server
  }
}`)
}
