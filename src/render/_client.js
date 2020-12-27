'use strict'

module.exports = ({ baseUrl = '', extraHeaders = {}, credentials = undefined, extraRequests = {} }) => {
  let fetch
  if (global.window) {
    if (!window.fetch) {
      require('whatwg-fetch')
    }
    fetch = window.fetch
  } else {
    fetch = require('node-fetch')
  }

  function applyExtraRequests (target, extraRequests) {
    for (const method in extraRequests) { // eslint-disable-line guard-for-in
      const conf = extraRequests[method]

      if (conf.sub) {
        const subObj = {}

        applyExtraRequests(subObj, extraRequests)

        out[method] = (...params) => {
          const url = [conf.url, ...params].join('/')

          for (const key in subObj) { // eslint-disable-line guard-for-in
            const o = subObj[key]

            subObj[key] = (a1, a2) => o(a1, a2, url)
          }
        }
      } else {
        out[method] = (a1, a2, bUrl) => {
          const extraHeaders = conf.method === 'GET' ? a1 : a2
          const body = conf.method === 'GET' ? null : a1

          return req(conf.url || bUrl, conf.method || 'GET', { ...conf.headers, ...extraHeaders }, conf.body || body ? { ...(conf.body ? conf.body : {}), ...(body || {}) } : null)
        }
      }
    }
  }

  const req = async (url, method = 'GET', headers = {}, body) => {
    if (body) {
      headers['content-type'] = 'application/json'
      body = JSON.stringify(body)
    }

    Object.assign(headers, extraHeaders)

    const res = await fetch(`${baseUrl}/${url}`, { credentials, method, headers, body })
    const data = await res.json()

    if (res.status >= 400 || data.error) {
      const error = data.error ? `${data.error} (${res.status} ${res.statusText})` : `${res.status} ${res.statusText}`
      throw Object.assign(new Error(`[${method} /${url}] ${error}`), { url, status: res.status, statusText: res.statusText, apiError: data.error })
    }

    return data
  }

  const out = { structure }

  applyExtraRequests(out, extraRequests)

  return out
}
