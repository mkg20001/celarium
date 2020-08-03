'use strict'

const os = require('os')
const path = require('path')

const mod = require('module')
const load = mod._load.bind(mod)
delete mod._load

const TMPDIR = os.tmpdir()
const SELFDIR = path.dirname(__dirname)
const MODDIR = path.join(SELFDIR, 'node_modules')

mod._load = (...a) => {
  if (a[0].startsWith('celarium')) { // mock celarium
    a[0] = a[0].replace(/^celarium/, SELFDIR)
  }

  if (!a[1].jacked && a[1].id.startsWith(TMPDIR)) {
    a[1].jacked = true
    a[1].paths.push(MODDIR)
  }

  return load(...a)
}
