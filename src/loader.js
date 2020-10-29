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

/* const attributeSchemaBase = { // attr schema base
  type: Joi.string().required()
}

const valueAttrSchemaBase = Object.assign({
  modify: Joi.array().items(Joi.string()).default([]),
  notNull: Joi.boolean().default(false)
}, attributeSchemaBase)

const valueAttrSchemaPre = Joi.object(valueAttrSchemaBase).pattern(/./, Joi.any())

const attributeSchemaPre = Joi.object(attributeSchemaBase).pattern(/./, Joi.any())

const listAttrSchema = Joi.object(Object.assign({
  append: Joi.array().items(Joi.string()).default([]),
  delete: Joi.array().items(Joi.string()).default([])
}, attributeSchemaBase))

const attributeSchemaBase = Joi. */

const listSchema = Joi.object({
  type: Joi.string().pattern(/\[\]$/).required(),
  append: Joi.array().items(Joi.string()).default([]),
  delete: Joi.array().items(Joi.string()).default([])

})

const types = require('./types')

const typeSchemas = Object.keys(types).map(type => {
  return Object.assign({
    type: Joi.string().valid(type).required(),
    modify: Joi.array().items(Joi.string()).default([]),
    notNull: Joi.boolean().default(false)
  }, types[type].parameters)
})

const attrSchemas = [
  listSchema,
  ...typeSchemas
]

const attributeSchema = Joi.alternatives().try(...attrSchemas)

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
