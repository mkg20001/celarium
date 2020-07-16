'use strict'

const loader = require('./loader')
const validator = require('./validator')
const compiler = require('./compiler')
const render = require('./render')

module.exports = async (src, outFolder) => {
  const contents = await loader(src)

  validator(contents)

  console.log(contents)
  console.log(contents.post.attributes)

  const compiledFiles = await compiler(contents, {
    db: require('./render/mongoose'),
    api: require('./render/hapi'),
    base: require('./render/base'),
    client: require('./render/client'),
    joi: require('./render/joi')
  })

  console.log(compiledFiles)

  await render(compiledFiles, outFolder)
}
