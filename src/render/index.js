'use strict'

const { S } = require('../utils')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp').sync

module.exports = (files, outFolder) => {
  mkdirp(outFolder)
  for (const file in files) { // eslint-disable-line guard-for-in
    const outName = path.join(outFolder, `${file}.js`)
    fs.writeFileSync(outName, S(files[file]))
  }
}
