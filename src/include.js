'use strict'

const Joi = require('@hapi/joi')

module.exports = {
  configValidate: Joi.object({
    api: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().integer().min(1).max(60000).required(), // TODO: correct portnum max
      extraConfig: Joi.object(),
      getUser: Joi.function().required()
    }).required(),
    db: Joi.object().required()
  }).required()
}
