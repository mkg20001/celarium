'use strict'

/* eslint-env mocha */

const chai = require('chai')
const expect = chai.expect

const parse = require('../src/acl').parse

const {
  generateTests,
  generateCode
} = require('./util')

describe('requests', () => {
  describe('hapi', () => {
    let generated
    let stubDb
    let api
    let hapi
    let root

    before(async function () {
      this.timeout(10000)
      generated = await generateCode('node:' + require.resolve('../example'))
      stubDb = await generated.load('db')()
      api = await generated.load('api')({
        host: '0.0.0.0',
        port: 7788,
        getUser: h => 1
      }, stubDb)

      hapi = api._hapi

      await hapi.register({
        plugin: require('hapi-pino'),
        options: { name: 'test-celarium' }
      })

      await hapi.initialize()
    })

    describe('basic fetch', () => {
      let el

      before(async () => {
        el = stubDb.db.create('board', {
          name: 'Test',
          description: 'test'
        })
      })

      it('fetch newly created board', async () => {
        const res = await hapi.inject({
          method: 'get',
          url: `/board/${el.id}`
        })

        expect(res.statusCode).to.equal(200)
        expect(JSON.parse(res.payload)).to.have.property('name').that.is.equal('Test')
      })
    })

    after(async () => {
      generated.cleanup()
    })
  })
})
