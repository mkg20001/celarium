'use strict'

const { L } = require('../utils')
const FJoi = require('fake-joi')

module.exports = {
  mongoose: {
    literalParameters: params => {
      const out = { type: L('Boolean'), required: params.required || false }

      return out
    }
  },
  joi: {
    literalParameters: params => {
      const out = FJoi.boolean()

      if (params.required) {
        out.required()
      }

      return L(out._)
    }
  },
  parameters: {}
}
