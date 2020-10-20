'use strict'

const {Linter} = require('eslint')
const {S, L} = require('./utils')

async function compiler(tree, render, beautify) {
  const out = {}
  const treeStripped = {}

  const eslint = new Linter({fix: true})

  for (const key in tree) {
    if (!key.startsWith('@')) {
      treeStripped[key] = tree[key]
    }
  }

  for (const renderer in render) { // eslint-disable-line guard-for-in
    const code = render[renderer](treeStripped)

    if (beautify) {
      const eOut = await eslint.lintText(S(code))[0] // standard.lintTextSync(code, {fix: true}).results[0].output
      if (!eOut.output) {
        throw new Error('FATAL: Generated code cant be parsed...')
      }
      out[renderer] = L(eOut.code)
    } else {
      out[renderer] = code
    }
  }

  return out
}

module.exports = compiler
