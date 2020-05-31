'use strict'

const { S } = require('./utils')
const path = require('path')
const fs = require('fs')

module.exports = (files, outFolder) => {
  for (const file in files) {
    const outName = path.join(outFolder, `${file}.js`)
    fs.writeFileSync(outName, S(files[file]))    
  }
}
