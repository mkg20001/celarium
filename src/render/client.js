'use strict'

const { L, S, Joi, iterateKeys, iterateKeysToArstr } = require('../utils')

const fs = require('fs')
const template = String(fs.readFileSync(require.resolve('./_client.js')))

module.exports = models => {
  const structure = iterateKeys(models, (modelName, model) => {
    return L(`Object.assign(function (id) {
     return ${S(iterateKeys(model.attributes, (attrName, attr) => {
       if (attr.isList) {
         return {
           get: L(`(opt) => req(\`${modelName}/\${id}/${attrName}\`)`), // TODO: add opts for pagination
           append: L(`(idOrObj) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, idOrObj)`),
           remove: L(`(id) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, id)`)
         }
       }
         return {
           get: L(`() => req(\`${modelName}/\${id}/${attrName}\`)`),
           set: L(`(newValue) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, newValue)`)
         }
    }))}
    }, ${S({
      get: L(`(id) => req(${S(modelName + '/')} + id)`),
      patch: L(`(id, newValues) => req(${S(modelName + '/')} + id, 'PATCH', {}, newValues)`)
    })})`)
  })

  /* const structure = iterateKeysToArstr(models, (modelName, model) => {
    return L(`new mongoose.Schema(${S(Object.assign(iterateKeys(model.attributes, (attrName, attr) => {
      if (attr.isNativeType) {
        return attr.typeObj.mongoose.literalParameters(attr.typeParameters) // TODO: add .typeParameters
      }

      if (attr.isList) {
        if (attr.isNativeType) {
          return L(`{ type: Array, item: ${S(attr.typeObj.mongoose.literalParameters(attr.typeParameters))} }`)
        }

        return L('{ type: Array, item: mongoose.ObjectID }') // TODO: db relations
      }
    }) /* TODO: ACLs *, { parent: L('{ type: mongoose.ObjectID }') }))})`)
  }) */

  return L(template.replace('{ structure }', S(structure)))
}
