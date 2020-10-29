'use strict'

module.exports = (baseObj, dbm, cache = { [baseObj.id]: baseObj }, next) => {
  const dCache = [baseObj]

  const _dbmFetch = async (model, id) => {
    if (!id) {
      throw new Error('Invalid id... inverse-stack-overflow')
    }

    if (!cache[id]) {
      cache[id] = dbm.get(model, id)
      cache[id] = await cache[id]
    }

    return cache[id]
  }

  const _fetch = async depth => {
    if (depth === -1) return next // TODO: throw if next is null

    if (!dCache[depth]) {
      if (!dCache[depth - 1]) {
        await _fetch(depth - 1)
      }

      dCache[depth] = _dbmFetch(dCache[depth - 1].parent.model, dCache[depth - 1].parent.id)
      dCache[depth] = await dCache[depth]
    }

    return dCache[depth]
  }

  return {
    fetch: _fetch,
    dive: async depth => {
      const baseObj = await _fetch(depth)
      return module.exports(baseObj, dbm, cache) // there's never a next
    }
  }
}
