'use strict'

const { L, Joi } = require('../utils')

module.exports = {
  mongoose: {
    literalParameters: params => {
      return { type: L('Object'), required: params.notNull }
    }
  }
}
