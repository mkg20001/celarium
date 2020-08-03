'use strict'

const assert = require('assert').strict
const celarium = require('../src')

const os = require('os')
const path = require('path')
const mkdirp = require('mkdirp').sync
const rimraf = require('rimraf').sync

require('./_mock')

function makeTemp () {
  const tempPath = path.join(os.tmpdir(), 'celarium', String(Math.random()))
  mkdirp(tempPath)

  return {
    tempPath,
    cleanup: () => rimraf(tempPath)
  }
}

module.exports = {
  generateTests (ioList, fnc) {
    ioList.forEach(({ input, output }) => {
      it(`${JSON.stringify(input)} => ${JSON.stringify(output)}`, async () => {
        assert.deepEqual(await fnc(input), output)
      })
    })
  },
  async generateCode (inputModel, config = { db: 'stub-db', api: 'hapi' }) {
    const temp = makeTemp()

    await celarium(inputModel, temp.tempPath, config)

    return {
      codePath: temp.tempPath,
      cleanup: temp.cleanup,
      load: mod => require(path.join(temp.tempPath, `${mod}.js`))
    }
  }

}
