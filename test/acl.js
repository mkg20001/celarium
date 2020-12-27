'use strict'

/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect

const parse = require('../src/acl').parse

const {
  generateTests,
  generateCode,
} = require('./util')

describe('access control', () => {
  describe('parse rules', () => {
    generateTests([
      {
        input: '$.creator',
        output: {
          depth: 1,
          mode: 'next',
          name: 'creator',
          type: 'property',
        },
      },
      {
        input: '$$.creator',
        output: {
          depth: 2,
          mode: 'next',
          name: 'creator',
          type: 'property',
        },
      },
    ], parse)

    it('fails if invalid', async () => {
      expect(() => parse('&&&')).to.throw(/Unexpected character/)
    })
  })

  describe('validation', () => {
    let generated
    let stubDb
    let acl

    before(async function () {
      this.timeout(10000)
      generated = await generateCode('node:' + require.resolve('../example'))
      const ACL = generated.load('acl')
      stubDb = generated.load('db')({}, ACL)
      acl = ACL(stubDb)
    })

    describe('board acl', () => {

    })

    after(async () => {
      generated.cleanup()
    })
  })
})
