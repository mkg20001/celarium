'use strict'

const {L, Joi} = require('../utils')
const FJoi = require('fake-joi')

module.exports = {
  mongoose: {
    literalParameters: params => {
      const out = {type: L('String'), required: params.required || false}

      if (params.minLength) {
        out.minLength = params.minLength
      }
      if (params.maxLength) {
        out.maxLength = params.maxLength
      }

      return out
    },
  },
  joi: {
    literalParameters: params => {
      const out = FJoi.string()

      if (params.required) {
        out.required()
      }

      if (params.minLength) {
        out.min(params.minLength)
      }

      if (params.maxLength) {
        out.max(params.maxLength)
      }

      return L(out._)
    },
  },
  parameters: {
    minLength: Joi.number().integer().min(1),
    maxLength: Joi.number().integer().min(1),
  },
}
