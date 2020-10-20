'use strict'

const loader = require('./loader')
const validator = require('./validator')
const compiler = require('./compiler')
const render = require('./render')

module.exports = async (src, outFolder, config = {api: 'hapi', db: 'mongoose', beautify: true}) => {
  const contents = await loader(src)

  validator(contents)

  const compiledFiles = await compiler(contents, {
    acl: require('./render/acl'),
    db: require('./render/' + config.db),
    api: require('./render/' + config.api),
    base: require('./render/base'),
    client: require('./render/client'),
    joi: require('./render/joi'),
  }, config.beautify)

  await render(compiledFiles, outFolder)
}

module.exports.jit = require('./jit')
