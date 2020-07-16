'use strict'

const { L, S, Joi, iterateKeys, iterateKeysToArstr } = require('../utils')

const fs = require('fs')
const template = String(fs.readFileSync(require.resolve('./_client.js')))

module.exports = models => {
  const structure = iterateKeys(models, (modelName, model) => {
    return L(`Object.assign(function (id) {
     return ${S(Object.assign(iterateKeys(model.attributes, (attrName, attr) => {
       if (attr.isList) {
         return {
           get: L(`(opt) => req(\`${modelName}/\${id}/${attrName}\`)`), // TODO: add opts for pagination
           append: L(`(idOrObj) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, idOrObj)`),
           remove: L(`(rId) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, rId)`)
         }
       }

       return {
         get: L(`() => req(\`${modelName}/\${id}/${attrName}\`)`),
         set: L(`(newValue) => req(\`${modelName}/\${id}/${attrName}\`, 'POST', {}, newValue)`)
       }
    }), {
      get: L(`() => req(${S(modelName + '/')} + id)`),
      patch: L(`(newValues) => req(${S(modelName + '/')} + id, 'PATCH', {}, newValues)`)
    }))}
    }, ${S({
      get: L(`(id) => req(${S(modelName + '/')} + id)`),
      patch: L(`(id, newValues) => req(${S(modelName + '/')} + id, 'PATCH', {}, newValues)`)
    })})`)
  })

  return L(template.replace('{ structure }', S(structure)))
}
