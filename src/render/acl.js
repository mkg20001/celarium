'use strict'

const {L, S, iterateKeys} = require('../utils')

module.exports = models => {
  const acls = iterateKeys(models, (modelName, model) => {
    return {
      lists: iterateKeys(model.acl, (listName, list) => {
        return list
      }),
      base: {
        read: model.read,
      },
      attrs: iterateKeys(model.attributes, (attrName, attr) => {
        if (attr.isList) {
          return {append: attr.append, delete: attr.delete, read: attr.read}
        }

        return {modify: attr.modify, read: attr.read}
      }),
    }
  })

  return L(`'use strict'

module.exports = DBM => {
  return (require('celarium/src/acl/db')(DBM, ${S(acls)}))
}`)
}
