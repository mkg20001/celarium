#!/usr/bin/env node

'use strict'

const generate = require('.')

require('yargs') // eslint-disable-line
.scriptName('celarium')
.command(['generate [schema] [out]', '$0 [schema] [out]'], 'generate a config', yargs => {
  yargs
  .option('schema', {
    alias: 's',
    type: 'string',
    description: 'Loader-string where to find schema (fs:./file.json, node:./file.js)',
    required: true,
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Path where to output files',
    required: true,
  })
  .option('db', {
    alias: 'd',
    description: 'DB-Engine to use',
    choices: ['mongoose', 'stub-db'],
    default: 'mongoose',
  })
  .option('api', {
    alias: 'a',
    description: 'API-Engine to use',
    choices: ['hapi'], // TODO: express
    default: 'hapi',
  })
  .option('beautify', {
    alias: 'b',
    description: 'Beautify output code with eslint',
    type: 'boolean',
    default: false,
  })
}, argv => {
  return generate(argv.schema, argv.out, {
    db: argv.db,
    api: argv.api,
    beautify: argv.beautify,
  })
})
.option('verbose', {
  alias: 'v',
  type: 'boolean',
  description: 'Run with verbose logging',
})
.help()
.argv
