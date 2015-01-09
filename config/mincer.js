var path          = require('path')
var ConnectMincer = require('connect-mincer')

module.exports = new ConnectMincer({
  root: path.resolve(__dirname, '../'),
  production: process.env.NODE_ENV === 'production',
  mountPoint: 'assets',
  manifestFile: path.resolve(__dirname, '../public/assets/manifest.json'),
  paths: ['assets'],
  assetHost: '//dc85sbb1t7joo.cloudfront.net'
})