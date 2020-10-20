'use strict'

const fmt = data => {
  switch (true) {
  case data && data._literal: return data._value
  case Array.isArray(data): return format.array(data)
  case typeof data === 'object': return format.object(data)
  case typeof data === 'boolean': return format.boolean(data)
  case typeof data === 'number': return format.number(data)
  case typeof data === 'string': return format.string(data)
  case typeof data === 'undefined': return 'undefined'
  default: {
    throw new Error(`Cannot convert ${typeof data} ${JSON.stringify(data)}`)
  }
  }
}

const format = {
  array: data => {
    return `[${data.map(value => fmt(value)).join(',')}]`
  },
  object: data => {
    const out = ['{']

    for (const key in data) { // eslint-disable-line guard-for-in
      out.push(`${JSON.stringify(key)}: ${fmt(data[key])},`)
    }

    if (out.length === 1) return '{}'

    out.push('}')

    return out.join('\n')
  },
  boolean: JSON.stringify,
  number: JSON.stringify,
  string: JSON.stringify,
}

module.exports = data => {
  return fmt(data)
}
