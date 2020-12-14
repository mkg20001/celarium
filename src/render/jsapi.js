'use strict'

const { L, S, Joi, iterateKeysToArstr, C } = require('../utils')

module.exports = (models, config) => {
  const routes = iterateKeysToArstr(models, (modelName, model) => {
    const route = (name, handler) => {
      return `async ${name} ${handler},`
    }

    const getRoute = modelName => {
      return route(`get${C(modelName)}`, `(id) {
      const obj = await DBM.db.getById('${modelName}', id)
      return obj
    }`)
    }

    const setRoute = modelName => {
      return route(`set${C(modelName)}`, `(id, val, userId = 0) { // using user 0 since we are the server
      const obj = await DBM.db.setById('${modelName}', id, val, userId)
      return obj
    }`)
    }
    return L(`    ${getRoute(modelName)}
    ${setRoute(modelName)}`)
  })
  return L(`'use strict'

module.exports = (config, DBM) => {
  const { validateAcls } = DBM
  const accessLog = false
  return {
${S(routes).slice(0, -1) // slice to remove the last ","
  }
  }
}
`)
}
