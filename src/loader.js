'use strict'

const fs = require('fs')
const Joi = require('@hapi/joi')

// TODO: add type to validate acl-references and possibly parse during validation

const aclSchema = Joi.object({
  initial: Joi.array().items(Joi.string()).default([]),
  fixed: Joi.array().items(Joi.string()).default([]),
  append: Joi.array().items(Joi.string()).default([]),
  delete: Joi.array().items(Joi.string()).default([])
})

const listSchema = {
  is: Joi.object({
    type: Joi.string().pattern(/\[\]$/).required()
  }).pattern(/./, Joi.any()),
  then: Joi.object({
    type: Joi.string().pattern(/\[\]$/).required(),
    append: Joi.array().items(Joi.string()).default([]),
    delete: Joi.array().items(Joi.string()).default([])
  })
}

const types = require('./types')

const typeSchemas = Object.keys(types).map(type => {
  return {
    is: Joi.object({
      type: Joi.string().valid(type).required()
    }).pattern(/./, Joi.any()),

    then: Object.assign({
      type: Joi.string().valid(type).required(),
      modify: Joi.array().items(Joi.string()).default([]),
      notNull: Joi.boolean().default(false)
    }, types[type].parameters)
  }
})

// TODO: use conditional switch (joi-style)

const attrSchemas = [
  listSchema,
  ...typeSchemas,
  {
    otherwise: {
      type: Joi.string().pattern(/^[a-z0-9]+$/).required(),
      modify: Joi.array().items(Joi.string()).default([]),
      notNull: Joi.boolean().default(false)
    }
  }
]

const attributeSchema = Joi.alternatives().conditional(null, { switch: attrSchemas })

const entrySchema = Joi.object({
  acl: Joi.object().pattern(/./, aclSchema),
  read: Joi.array().items(Joi.string()).default([]),
  attributes: Joi.object().pattern(/./, attributeSchema)
})

const schema = Joi.object({
  '@main': Joi.string().required(),
  '@imports': Joi.object().pattern(/./, Joi.string()).default({}) // TODO: validate path schema
}).pattern(/./, entrySchema)

const loadType = { // TODO: "steal" from parcel?
  fs: async path => {
    return JSON.parse(String(fs.readFileSync(path))) // todo: rel path?
  },
  node: async path => {
    return require(fs.realpathSync(path))
  }
}

async function loadTreeRecursivly (srcStr) {
  const [type, path] = srcStr.split(':')

  let contents = await loadType[type](path) // TODO: validation of type, read error catch

  const { value, error } = schema.validate(contents)

  if (error) {
    console.log(require('util').inspect(error, { colors: true, depth: null }))
    throw error
  }

  contents = value

  for (const _import in contents['@imports']) { // eslint-disable-line guard-for-in
    contents['@imports'][_import] = await loadTreeRecursivly(contents['@imports'][_import]) // eslint-disable-line no-await-in-loop
  }

  return contents
}

module.exports = loadTreeRecursivly
