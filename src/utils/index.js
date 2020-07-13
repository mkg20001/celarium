'use strict'

const Joi = require('@hapi/joi')

const stringify = require('./format')

module.exports = {
  L (str) {
    return { _literal: true, _value: str }
  },
  S: stringify,
  stringify,
  iterateKeys (obj, fnc) {
    const out = {}
    Object.keys(obj).forEach(key => (out[key] = fnc(key, obj[key], obj)))
    return out
  },
  iterateKeysToArray (obj, fnc) {
    const out = []
    Object.keys(obj).forEach(key => (out.push(fnc(key, obj[key], obj))))
    return out
  },
  Joi
}
