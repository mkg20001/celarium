'use strict'

/*function compile (obj, out, render) {
  const { acl, attributes, read, tree, visited } = obj
  if (visited) return
  obj.visited = true

  // TODO: get ns
  const ns = null
  const name = "sth"
  const fullName = (ns ? ('@' + ns) : '') + name
  const fullNameSafe = encodeURI(fullName).replace('%', 'a')
  
  out[fullNameSafe] = {}
  
  for (const renderer in render) {
    out[fullNameSafe][renderer] = render[renderer](obj)
  }
  
  // TODO: further recurse?
}

function compileInit (tree, render) {
  const { '@main': main } = tree
  const Main = tree[main]
  const out = {}
  compile(Main, out, render)
  return out
}*/

function compiler (tree, render) {
  const out = {}
  const treeStripped = {}
  
  for (const key in tree) {
    if (!key.startsWith('@')) {
      treeStripped[key] = tree[key]
    }
  }
  
  for (const renderer in render) {
    out[renderer] = render[renderer](treeStripped)
  }
  
  return out
}

module.exports = compiler

