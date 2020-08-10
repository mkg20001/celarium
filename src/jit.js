'use strict'

const os = require('os')
const path = require('path')

const celarium = require('.')

const mkdirp = require('mkdirp').sync
const rimraf = require('rimraf').sync

function makeTemp () {
  const tempPath = path.join(os.tmpdir(), 'celarium', String(Math.random()))
  mkdirp(tempPath)

  return {
    tempPath,
    cleanup: () => rimraf(tempPath)
  }
}

module.exports = (TMPDIR = os.tmpdir()) => {
  const mod = require('module')
  const load = mod._load.bind(mod)
  delete mod._load

  const SELFDIR = path.dirname(__dirname)
  const MODDIR = path.join(SELFDIR, 'node_modules')

  mod._load = (...a) => {
    if (a[0].startsWith('celarium')) { // mock celarium
      a[0] = a[0].replace(/^celarium/, SELFDIR)
    }

    if (!a[1].jacked && a[1].id.startsWith(TMPDIR)) {
      a[1].jacked = true
      a[1].paths.push(MODDIR)
      module.paths.forEach(p => a[1].paths.push(p))
    }

    return load(...a)
  }

  async function generateCode (inputModel, config = { db: 'stub-db', api: 'hapi' }) {
    const temp = makeTemp()

    await celarium(inputModel, temp.tempPath, config)

    return {
      codePath: temp.tempPath,
      cleanup: temp.cleanup,
      load: mod => require(path.join(temp.tempPath, `${mod}.js`))
    }
  }

  return {
    compileAndInit: async (inputModel, buildConfig, appConfig) => {
      const generated = await generateCode(inputModel, buildConfig)
      return generated.load('base')(appConfig)
    },
    compile: generateCode
  }
}
