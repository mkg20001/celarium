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
        host: '::',
        port: 7788
      }, stubDb)

      hapi = api._hapi

      await hapi.initialize()
    })

    describe('basic fetch', () => {
      let el

      before(async () => {
        el = stubDb.makeElement(await stubDb.getModel('board'), {
          name: 'test',
          description: 'test'
        })
      })

      it('fetch newly created board', async () => {
        const res = await hapi.inject({
          method: 'get',
          url: `/board/${el.id}`
        })
        expect(res.statusCode).to.equal(200)
      })
    })

    after(async () => {
      generated.cleanup()
    })
  })
})
