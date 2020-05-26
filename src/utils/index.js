'use strict'

const Joi = require('@hapi/joi')

const stringify = require('./format')

module.exports = {
  L (str) {
    return { _literal: true, _value: str }
  },
  S: stringify,
  stringify,
  Joi
}
