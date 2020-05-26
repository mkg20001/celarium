'use strict'

const { L, Joi } = require('../utils')

module.exports = {
  mongoose: {
    literalParameters: params => {
      const out = { type: L('String'), required: params.required }

      if (params.minLength) { out.minLength = params.minLength }
      if (params.maxLength) { out.maxLength = params.maxLength }

      return out
    }
  },
  parameters: {
    minLength: Joi.number().integer().min(1),
    maxLength: Joi.number().integer().min(1)
  }
}
