'use strict'

const { L, Joi } = require('../utils')

module.exports = {
  mongoose: {
    literalParameters: params => {
      const out = { type: L('Number'), required: params.notNull }

      return out
    }
  },
  parameters: {
    min: Joi.number(),
    max: Joi.number()
  }
}
