'use strict'

function matcher (mUser) {
  /*
  2 = exclude
  1 = include
  0 = no match
  */
  return ({ wildcard, user, not }) => {
    const r = not ? 2 : 1
    if (wildcard || user === mUser) return r
    return 0
  }
}

async function resolveAclRef ({ wildcard, not, mode, depth, type, name }, stack) {
  if (wildcard) {
    return {
      wildcard: true,
      not
    }
  }

  /*
  // in reverse, meaning "we" are at 0, now get that object and fetch it
  const stack = _stack.reverse()
  */

  // stack we pass on to the next object, edited as needed
  let newStack

  let targetObj

  switch (mode) {
    case 'prev': {
      // go back in stack by $depth

      targetObj = await stack.fetch(depth)
      newStack = stack.dive(depth)
      break
    }
    case 'next': {
      if (depth === 2) {
        // list object current object (used in remove clause of list)
        // targetObj = stack[0]
        // throw new Error('unimp')
        targetObj = await stack.fetch(-1)
      } else if (depth === 1) {
        // self (our property)
        targetObj = await stack.fetch(0) // isList ? stack[1] : stack[0]
      } else {
        throw new TypeError(depth)
      }
      break
    }
    default: {
      throw new TypeError(mode)
    }
  }

  switch (type) {
    case 'property': {
      return targetObj.props[name]
    }
    case 'acl': {
      return resolveAclRefs(targetObj, name, newStack)
    }
    default: {
      throw new TypeError(type)
    }
  }
}

async function resolveAclRefs (target, listName, stack) {
  const list = getList(target, listName)
  // const acl = dba.getAclLists(obj, model)
  const res = await Promise.all(list.map(entry => resolveAclRef(entry, stack)))
  return res.reduce((out, el) => (out.concat(Array.isArray(el) ? el : [el])), []) // flatten
}

module.exports = dba => {
  return {
    validateAcl: (obj, model, modelConfig, user) => {
      const res = resolveAclRefs(listName, stack)
      /*
      2 = exclude
      1 = include
      0 = no match
      */
      return res.map(matcher(user)).reduce((a, b) => a > b ? a : b, 0)
    }
  }
}
