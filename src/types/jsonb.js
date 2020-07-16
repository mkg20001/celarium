'use strict'

const { L, Joi } = require('../utils')
const FJoi = require('fake-joi')

module.exports = {
  mongoose: {
    literalParameters: params => {
      return { type: L('Object'), required: params.required || false }
    }
  },
  joi: {
    literalParameters: params => {
      return L(FJoi.any()._)
    }
  }
}
