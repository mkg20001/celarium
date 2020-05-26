'use strict'

const loader = require('./loader')
const validator = require('./validator')
/* const compiler = require('./compiler')
const render = require('./render') */

module.exports = async (src, { signoff } = {}) => {
  const contents = await loader(src)
  validator(contents)
  console.log(contents.post.attributes)
  /* const compiled = compiler({}, contents)
  const rendered = render(compiled, { signoff })
  return rendered */
}
