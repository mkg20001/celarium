'use strict'

function compiler (tree, render) {
  const out = {}
  const treeStripped = {}

  for (const key in tree) {
    if (!key.startsWith('@')) {
      treeStripped[key] = tree[key]
    }
  }

  for (const renderer in render) { // eslint-disable-line guard-for-in
    out[renderer] = render[renderer](treeStripped)
  }

  return out
}

module.exports = compiler
