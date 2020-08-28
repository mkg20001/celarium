'use strict'

const assert = require('assert').strict
const celarium = require('../src')

/* const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp').sync
const rimraf = require('rimraf').sync

function makeTemp () {
  const tempPath = path.join(os.tmpdir(), 'celarium', String(Math.random()))
  mkdirp(tempPath)

  return {
    tempPath,
    cleanup: () => rimraf(tempPath)
  }
} */

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
