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
      stubDb = await generated.load('db')({}, await generated.load('acl'))
      api = await generated.load('api')({
        host: '0.0.0.0',
        port: 7788,
        getUser: h => h.headers.uid ? parseInt(h.headers.uid, 10) : 0
      }, stubDb)

      hapi = api._hapi

      await hapi.register({
        plugin: require('hapi-pino'),
        options: { name: 'test-celarium' }
      })

      await hapi.initialize()
    })

    describe('basic fetch/post', () => {
      let el
      let res

      before(async () => {
        el = root = await stubDb.db.create('board', { // eslint-disable-line
          name: 'Test',
          description: 'test'
        })
      })

      it('fetch newly created board', async () => {
        res = await hapi.inject({
          method: 'get',
          url: `/board/${el.id}`
        })

        expect(res.statusCode).to.equal(200)
        expect(JSON.parse(res.payload)).to.have.property('name').that.is.equal('Test')
      })

      it('update name and verify', async () => {
        res = await hapi.inject({
          method: 'post',
          url: `/board/${el.id}/name`,
          payload: JSON.stringify('TestBoard')
        })

        expect(res.statusCode).to.equal(200)

        res = await hapi.inject({
          method: 'get',
          url: `/board/${el.id}`
        })

        expect(res.statusCode).to.equal(200)
        expect(JSON.parse(res.payload)).to.have.property('name').that.is.equal('TestBoard')
      })

      it('update name via mass update and verify', async () => {
        res = await hapi.inject({
          method: 'patch',
          url: `/board/${el.id}`,
          payload: JSON.stringify({ name: 'TheTestBoard' })
        })

        expect(res.statusCode).to.equal(200)

        res = await hapi.inject({
          method: 'get',
          url: `/board/${el.id}`
        })

        expect(res.statusCode).to.equal(200)
        expect(JSON.parse(res.payload)).to.have.property('name').that.is.equal('TheTestBoard')
      })
    })

    after(async () => {
      generated.cleanup()
    })
  })
})
