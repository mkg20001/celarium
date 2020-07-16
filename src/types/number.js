'use strict'

const { L, Joi } = require('../utils')
const FJoi = require('fake-joi')

module.exports = {
  mongoose: {
    literalParameters: params => {
      const out = { type: L('Number'), required: params.required || false }

      return out
    }
  },
  joi: {
    literalParameters: params => {
      const out = FJoi.number()

      if (params.required) {
        out.required()
      }

      if (params.min) {
        out.min(params.min)
      }

      if (params.max) {
        out.max(params.max)
      }

      return L(out._)
    }
  },
  parameters: {
    min: Joi.number(),
    max: Joi.number()
  }
}
