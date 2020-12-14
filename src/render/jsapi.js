'use strict'

const { L, S, Joi, iterateKeysToArstr, C } = require('../utils')

module.exports = (models, config) => {
  const routes = iterateKeysToArstr(models, (modelName, model) => {
    const route = (name, handler) => {
      return `async ${name} ${handler},`
    }

    const getRoute = modelName => {
      return route(`get${C(modelName)}`, `(id) {
    const obj = await this.DBM.db.getById('${modelName}', id)
    return obj
  }`)
    }

    const setRoute = modelName => {
      return route(`set${C(modelName)}`, `(id, val) {
    const obj = await this.DBM.db.setById('${modelName}', id, val, 0) // using user 0 since we are the server
    return obj
  }`)
    }
    return L(`
  ${getRoute(modelName)}
  ${setRoute(modelName)}`)
  })
  return L(`'use strict'

module.exports = {
  init (config, DBM) {
    const { validateAcls } = DBM
    this.DBM = DBM
    this.validateAcls = validateAcls
    this.accessLog = false
  },
${S(routes).slice(0, -1) // slice to remove the last ","
  }
}
`)
}
