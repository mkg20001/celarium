/* eslint-disable max-params */
'use strict'

const { L, S, Joi, iterateKeysToArstr, C } = require('../utils') // eslint-disable-line no-unused-vars

// const Stack = require('celarium/src/acl/stack')

module.exports = (models, config) => {
  const routes = iterateKeysToArstr(models, (modelName, model) => {
    const isSymbolic = obj => {
      return false // TODO: implement isSymbolic
    }
    const route = (method, path, handler, options) => {
      let o = ''
      if (options) {
        o = options.concat(',\n')
      }
      return `
  server.route({
    method: ${method},
    path: ${path},${o}
    handler: ${handler}
  })`
    }

    const getRoute = (path, handler, options) => {
      return route("'GET'", path, handler, options)
    }
    const patchRoute = (path, handler, options) => {
      return route("'PATCH'", path, handler, options)
    }
    const postRoute = (path, handler, options) => {
      return route("'POST'", path, handler, options)
    }

    const handlerBoiler = code => {
      return `async (h, reply) => {${code}
    }`
    }

    const objGetById = model => {
      return `const obj = await jsapi.get${C(model)}(h.params.id)`
    }

    const objSetById = (model, d) => {
      return `await DBM.db.setById(${S(model)}, obj.id, ${d}, getUser(h))`
    }

    const retObj = 'return obj'
    const retOK = 'return { ok: true }'

    const retAttr = attr => {
      return `return obj[${S(attr)}]`
    }

    const logAccess = (model, key, type, op, param) => {
      return `if (accessLog) {
          // await DBM.auditLog.addEntry(getUser(h), ${S(model)}, ${type}, h.params.id, "*", null, null) // (user, model, type, object, targetKey, operation, parameter)
          await DBM.auditLog.addEntry(getUser(h), ${S(model)}, ${type}, h.params.id, ${key}, ${S(op)}, ${param}) // (user, model, type, object, targetKey, operation, parameter)
        }`
    }

    const validateObjKey = (model, key, type, action, obj = 'obj') => {
      return `// (obj, user, modelName, model, attrName, action, listAction, listNextId)
        if (!await validateAcls(${obj}, getUser(h), '${model}', ${key}, '${type}')) { // obj, modelName, model, attrName, action?, listAction?, listNextId?
          ${action}
        }`
    }

    const validateObjKeys = (model, type) => {
      return `for (const key in obj) {
        ${validateObjKey(model, 'key', type, 'delete obj[key]')} else ${logAccess(model, 'key', type, "'null?'", "'null?'")}
      }`
    }

    const getPayload = 'const { payload } = h'

    const validatePayload = (model, type) => {
      return `for (const key in payload) {
        ${validateObjKey(model, 'key', type, 'throw Boom.unauthorized(\'Not authorised for key \' + JSON.stringify(key))')}
      }`
    }

    const modelGetRoute = model => {
      return getRoute(
        S(`/${model}/{id}`),
        handlerBoiler(`
      // TODO: validate request
      ${objGetById(model)}
      ${validateObjKeys(model, 'access')}
      ${retObj}`), false)
    }

    const modelPatchRoute = model => {
      return patchRoute(
        S(`/${model}/{id}`),
        handlerBoiler(`
      // TODO: validate request
      ${objGetById(model)}
      ${getPayload}
      ${validatePayload(model, 'modify')}
      ${objSetById(model, 'payload')}
      ${retOK}`), false)
    }

    const configOption = `
    // TODO: validate request
    // TODO: pagination, filtering...
    config: {
      validate: {
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(1000).default(50)
        }).options({ stripUnknown: true })
      }
    }`

    const modelGetListAttrRoute = (model, attr, subType) => {
      return getRoute(
        S(`/${model}/{id}/${attr}`),
        // FIXME: this should not be this long!
        handlerBoiler(`
          ${objGetById(model)}
          // TODO: access, etc per key
          ${validateObjKeys(model, 'modify')}
          ${logAccess(model, S(attr), "'access'", "'null?'", "'null?'")}
          // THIS IS ABSOLUTE GARBAGE AND SHOULD BE REPLACED ASAP
          // ALSO DOESN'T DO ACL
        
          // instead we should query by parent for non-sym and check ACLs during query
          // for sym no idea
        
          const startAt = h.query.limit * (h.query.page - 1)
          const endAt = h.query.limit * h.query.page
          const total = obj[${S(attr)}].length
        
          let res = await Promise.all(obj[${S(attr)}].slice(startAt, endAt).map(id => DBM.db.getById(${S(subType)}, id)))
        
          await Promise.all(res.map(async obj => {
            ${validateObjKeys(subType, 'access')}
          }))
        
          return res`),
        configOption)
    }

    const modelAttrAppendRoute = (model, attr, subType) => {
      let symbolSpec = `// if:non-symbolic = payload should be object, created with this as parent, added to list
                // TODO: recursivly validate acls
                const newId = (await DBM.db.create(${S(subType)}, payload, getUser(h))).id`
      if (isSymbolic(subType)) {
        symbolSpec = `// if:symbolic = payload should be id, added to list
                await DBM.db.getById(${S(subType)}, payload) // check if exists`
      }
      return postRoute(
        `'/${model}/{id}/${attr}/append'`,
        handlerBoiler(`
          ${objGetById(model)}
          ${validateObjKey(model, S(attr), 'append', 'throw Boom.unauthorized()')}
          ${getPayload}
          ${symbolSpec}
          ${objSetById(model, `{[${S(attr)}]: (obj[${S(attr)}] || []).concat([newId])}`)}
          ${logAccess(model, S(attr), "'modify'", "'null?'", "'null?'")}
        return newId`), false)
    }

    const modelAttrRemoveRoute = (model, attr, subType) => {
      // this accepts an id to remove. for non-sym it also removes the object from db (or rather disassociates it ala soft-delete - but we should leave this to the user FIXME)
      let symbolSepc = `await DBM.db.setById(${S(subType)}, rId, { parent: null }, getUser(h)) // if not-symbolic
                await DBM.db.delById(${S(subType)}, rId)` // TODO: add if Symbolic
      if (isSymbolic(subType)) {
        symbolSepc = ''
      }
      return postRoute(
        S(`/${model}/{id}/${attr}/remove`),
        handlerBoiler(`
          ${objGetById(model)}
          const rId = h.payload
          const rObj = await DBM.db.getById(${S(subType)}, rId)
          ${validateObjKey(model, S(attr), 'remove', 'throw Boom.unauthorized()', 'rObj')}
          ${symbolSepc}
          ${logAccess(model, S(attr), 'modify', 'remove', 'rId')}
          ${objSetById(model, `{ [${S(attr)}]: obj[${S(attr)}].filter(id => id !== rId) }`)}
          ${retOK}`), false)
    }

    const modelAttrGetRoute = (model, attr) => {
      return getRoute(
        `'/${model}/{id}/${attr}'`,
        handlerBoiler(`
        ${objGetById(model)}
        ${validateObjKey(model, S(attr), 'access', 'throw Boom.unauthorized()')}
        ${logAccess(model, S(attr), "'access'", 'null', 'null')}
        ${retAttr(attr)}`), false)
    }

    const modelAttrPostRoute = (model, attr) => {
      return postRoute(
        `'/${model}/{id}/${attr}'`,
        handlerBoiler(`
          ${objGetById(model)}
          ${validateObjKey(model, S(attr), 'modify', 'throw Boom.unauthorized()')}
          ${logAccess(model, S(attr), "'modify'", 'null', 'null')}
          ${objSetById(model, `{[${S(attr)}]: h.payload}`)}
          ${retOK}`), false)
    }

    const modelAttrRoutes = (modelName, attributes) => {
      return S(iterateKeysToArstr(attributes, (attrName, attr) => {
        if (attr.isList) {
          const subType = attr.typeName // we already have that loaded somewhere else, so no need to pull again
          return L(`
            ${modelGetListAttrRoute(modelName, attrName, subType)}
            ${modelAttrAppendRoute(modelName, attrName, subType)}
            ${modelAttrRemoveRoute(modelName, attrName, subType)}`)
        }
        return L(`
            ${modelAttrGetRoute(modelName, attrName)}
            ${modelAttrPostRoute(modelName, attrName)}`)
      }))
    }

    return L(`
      // TODO: audit log acl violations
      ${modelGetRoute(modelName)}
      ${modelPatchRoute(modelName)}
      ${modelAttrRoutes(modelName, model.attributes)}`)
  })

  return L(`'use strict'

const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const Joi = require('joi')

module.exports = async (config, DBM) => {
  const { validateAcls } = DBM
  const jsapi = require('./jsapi')(config, DBM)
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
