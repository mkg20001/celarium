'use strict'

module.exports = (baseObj, dbm, cache = { [id]: baseObj }, next) => {
  const dCache = [baseObj]

  const _dbmFetch = async id => {
    if (!cache[id]) {
      cache[id] = dbm.fetch(id)
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

      dCache[depth] = _dbmFetch(dCache[depth - 1].parent)
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
