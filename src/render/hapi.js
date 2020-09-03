'use strict'

const { L, S, Joi, iterateKeysToArstr } = require('../utils')

// const Stack = require('celarium/src/acl/stack')

module.exports = (models, config) => {
  const routes = iterateKeysToArstr(models, (modelName, model) => {
    const route = (method, path, options, handler) => {
      return L(`server.route(${S(Object.assign({
        method,
        path,
        handler
      }, options))})`)
    }

    return L(`
      // TODO: log acl violations

      server.route({
        method: 'GET',
        path: '/${modelName}/{id}',
        // TODO: validate request
        handler: async (h, reply) => {
          const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

          for (const key in obj) {
            // (obj, user, modelName, model, attrName, action, listAction, listNextId)
            if (!await validateAcls(obj, getUser(h), ${S(modelName)}, key, 'access')) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
              delete obj[key]
            } else if (accessLog) {
              // await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "access", h.params.id, "*", null, null) // (user, model, type, object, targetKey, operation, parameter)
              await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "access", h.params.id, key) // (user, model, type, object, targetKey, operation, parameter)
            }
          }

          return obj
        }
      })

      server.route({ // modify the object (should do all the checks per-key - should lists be modifiable here (append)? prob not...)
        method: 'PATCH',
        path: '/${modelName}/{id}',
        // TODO: validate request
        handler: async (h, reply) => {
          const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

          const {payload} = h

          for (const key in payload) {
            // (obj, user, modelName, model, attrName, action, listAction, listNextId)
            if (!await validateAcls(obj, getUser(h), ${S(modelName)}, key, 'modify')) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
              throw Boom.unauthorized('Not authorised for key ' + JSON.stringify(key))
            }
          }

          await DBM.db.setById(${S(modelName)}, obj.id, payload, getUser(h))

          return {ok: true}
        }
      })

      ${S(iterateKeysToArstr(model.attributes, (attrName, attr) => {
        if (attr.isList) {
          const subType = attr.typeName // we already have that loaded somewhere else, so no need to pull again

          return L(`
          server.route({ // this gets all the objects in a list, with pagination etc...
            method: 'GET',
            path: '/${modelName}/{id}/${attrName}',
            // TODO: validate request
            // TODO: pagination, filtering...
            handler: async (h, reply) => {
              const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

              // TODO: access, etc per key

              if (!await validateAcls(obj, getUser(h), ${S(modelName)}, key, null, 'modify', "todo")) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
                throw Boom.unauthorized('Not authorised for key ' + JSON.stringify(key))
              }

              if (accessLog) {
                await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "access", h.params.id, ${S(attrName)}, null, null) // (user, model, type, object, targetKey, operation, parameter)
              }
            }
          })

          server.route({ // this accepts either an object to create (for non-sym) or an id to append (for sym). for non-sym parent is set to the current object id
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}/append',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

              // (obj, user, modelName, model, attrName, action, listAction, listNextId)
              if (!await validateAcls(obj, getUser(h), ${S(modelName)}, ${S(attrName)}, null, 'append')) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
                throw Boom.unauthorized()
              }

              const {payload} = h

              // if:symbolic = payload should be id, added to list
              // if:non-symbolic = payload should be object, created with this as parent, added to list

              // non-symbolic
              const newId = makeElement (${modelName}, payload, getUser(h), h.params.id)
              await DBM.set(obj, ${S(attrName)}, obj[${S(attrName)}].concat([newId]), getUser(h))

              await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}, "add", newId) // (user, model, type, object, targetKey, operation, parameter)
            }
          })

          server.route({ // this accepts an id to remove. for non-sym it also removes the object from db (or rather disassociates it ala soft-delete - but we should leave this to the user FIXME)
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}/remove',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.db.getById(${S(modelName)}, h.params.id)
              const rId = h.payload
              const rObj = await DBM.getById(${S(subType)}, rId)

              // (obj, user, modelName, model, attrName, action, listAction, listNextId)
              if (!await validateAcls(obj, getUser(h), ${S(modelName)}, ${S(attrName)}, null, 'remove', rId)) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
                throw Boom.unauthorized()
              }

              await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}, "remove", rId) // (user, model, type, object, targetKey, operation, parameter)

              await DBM.setById(${S(subType)}, rId, { parent: null }, getUser(h)) // if not-symbolic
              await DBM.setById(${S(modelName)}, h.params.id, { [${S(attrName)}]: obj[${S(attrName)}].filter(id => id !== rId) })
            }
          })
          `)
        }

        /* return `${S(route('POST', `/${modelName}/{id}/${attrName}`, {}, L(`async (h, reply) => {
          await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}) // (user, model, type, object, targetKey, operation, parameter)
        }`)))}` */

        return L(`
          server.route({ // this gets the value for a key
            method: 'GET',
            path: '/${modelName}/{id}/${attrName}',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

              // (obj, user, modelName, model, attrName, action, listAction, listNextId)
              if (!await validateAcls(obj, getUser(h), ${S(modelName)}, ${S(attrName)}, 'access')) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
                throw Boom.unauthorized()
              }

              await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "access", h.params.id, ${S(attrName)}) // (user, model, type, object, targetKey, operation, parameter)

              return obj[${S(attrName)}]
            }
          })

          server.route({ // this accepts a new value for a key
            method: 'POST',
            path: '/${modelName}/{id}/${attrName}',
            // TODO: validate request
            handler: async (h, reply) => {
              const obj = await DBM.db.getById(${S(modelName)}, h.params.id)

              // (obj, user, modelName, model, attrName, action, listAction, listNextId)
              if (!await validateAcls(obj, getUser(h), ${S(modelName)}, ${S(attrName)}, 'modify')) {
                throw Boom.unauthorized()
              }

              await DBM.auditLog.addEntry(getUser(h), ${S(modelName)}, "modify", h.params.id, ${S(attrName)}) // (user, model, type, object, targetKey, operation, parameter)

              await DBM.db.setById(${S(modelName)}, obj.id, {[${S(attrName)}]: h.payload}, getUser(h))

              return {ok: true}
            }
          })
          `)
      }))}`)
  })

  return L(`'use strict'

const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')

module.exports = async (config, DBM) => {
  const {validateAcls} = DBM
  const accessLog = false // TODO: make configurable?

  const server = new Hapi.Server({
    host: config.host,
    port: config.port
  })

  const getUser = config.getUser

  ${S(routes)}

  return {
    start: () => server.start(),
    stop: () => server.stop(),
    _hapi: server
  }
}`)
}
