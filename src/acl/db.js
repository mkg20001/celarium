'use strict'

/* eslint-disable max-params */

const Stack = require('./stack')

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

async function resolveAclRef (aclBase, { wildcard, not, mode, depth, type, name }, stack) {
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
      return resolveAclRefs(aclBase, targetObj, targetObj.model, name, newStack)
    }
    default: {
      throw new TypeError(type)
    }
  }
}

async function recursiveResolve (aclBase, list, stack) {
  const res = await Promise.all(list.map(entry => resolveAclRef(aclBase, entry, stack)))
  return res.reduce((out, el) => (out.concat(Array.isArray(el) ? el : [el])), []) // flatten
}

function resolveAclRefs (aclBase, targetObj, modelName, listName, stack) {
  const list = getListAclsFor(aclBase, targetObj, modelName, listName, stack)
  // const acl = dba.getAclLists(obj, model)
  return recursiveResolve(aclBase, list, stack)
}

function getPropertyAclsFor (aclBase, modelName, attrName, action) {
  console.log(aclBase, modelName, attrName, action)
  const attr = aclBase[modelName] && aclBase[modelName].attrs[attrName]
  console.log('foundAttr', attr)

  if (!attr) return false

  if (action === 'access') {
    action = 'read' // TODO: single terminology
  }

  console.log((attr[action] || []).concat(aclBase[modelName].base[action]))

  return (attr[action] || []).concat(aclBase[modelName].base[action])
}

function getListAclsFor (aclBase, targetObj, stack, modelName, listName) {
  const list = aclBase[modelName] && aclBase[modelName].lists[listName]

  if (!list) {
    return false
  }

  /*

  -fixed:
    - always add those
  - initial:
    - these have been added at creation, so are in db now
  - append / delete:
    - these are important for acl changes, so also irrelevant

  */

  return list.fixed.concat(targetObj.acl[listName] || [])
}

module.exports = (DBM, aclBase) => {
  return {
    /* validateAcl: (obj, model, user) => {
      const res = resolveAclRefs(obj, listName, Stack(obj, DBM))
      /*
      2 = exclude
      1 = include
      0 = no match
      *
      return res.map(matcher(user)).reduce((a, b) => a > b ? a : b, 0)
    } */
    async validateAcls (obj, user, modelName, model, attrName, action, listAction, listNextId) {
      return true // TODO: implement later

      const stack = Stack(obj, DBM, null, listNextId)
      const base = getPropertyAclsFor(aclBase, obj, modelName, attrName, action || listAction)

      const res = await recursiveResolve(aclBase, base, stack)

      /*
      2 = exclude
      1 = include
      0 = no match
      */

      return res.map(matcher(user)).reduce((a, b) => a > b ? a : b, 0)
    }
  }
}
