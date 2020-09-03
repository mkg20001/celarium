'use strict'

/* eslint-env mocha */
/* eslint-disable require-atomic-updates */

const chai = require('chai')
const expect = chai.expect

const parse = require('../src/acl').parse

const {
  generateTests,
  generateCode
} = require('./util')

describe('db', () => {
  describe('stub', () => {
    let generated
    let stubDb
    let el

    before(async function () {
      this.timeout(10000)
      generated = await generateCode('node:' + require.resolve('../example'))
      stubDb = await generated.load('db')({}, await generated.load('acl'))
    })

    it('board create', async () => {
      el = await stubDb.db.create('board', { // eslint-disable-line
        name: 'Test',
        description: 'test'
      })

      expect(el).to.have.property('name').that.is.equal('Test')
    })

    it('board fetch', async () => {
      el = await stubDb.db.getById('board', el.id)

      expect(el).to.have.property('name').that.is.equal('Test')
    })

    after(async () => {
      generated.cleanup()
    })
  })
})
