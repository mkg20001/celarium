'use strict'

module.exports = (baseUrl, extraHeaders, credentials) => {
  const { fetch } = window // TODO: polyfill?

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
      throw Object.assign(new Error(`[/${url}] ${error}`), { url, status: res.status, statusText: res.statusText, apiError: data.error })
    }

    return data
  }

  const out = { structure }

  return out
}
