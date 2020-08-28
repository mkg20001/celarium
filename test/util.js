'use strict'

const assert = require('assert').strict
const celarium = require('../src')

module.exports = {
  generateTests (ioList, fnc) {
    ioList.forEach(({ input, output }) => {
      it(`${JSON.stringify(input)} => ${JSON.stringify(output)}`, async () => {
        assert.deepEqual(await fnc(input), output)
      })
    })
  },
  generateCode (inputModel, config = { db: 'stub-db', api: 'hapi' }) {
    return celarium.jit().compile(inputModel, config)
  }
}
