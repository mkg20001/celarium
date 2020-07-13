'use strict'

const { ESLint } = require('eslint')
const { S, L } = require('./utils')

async function compiler (tree, render) {
  const out = {}
  const treeStripped = {}

  const eslint = new ESLint({ fix: true })

  for (const key in tree) {
    if (!key.startsWith('@')) {
      treeStripped[key] = tree[key]
    }
  }

  for (const renderer in render) { // eslint-disable-line guard-for-in
    const code = render[renderer](treeStripped)
    out[renderer] = L((await eslint.lintText(S(code)))[0].output) // standard.lintTextSync(code, {fix: true}).results[0].output
  }

  return out
}

module.exports = compiler
