var config        = require('./config')
var path          = require('path')
var Mincer        = require('mincer')
var ConnectMincer = require('connect-mincer')

Mincer.MacroProcessor.configure(['.less', '.js'])
Mincer.Autoprefixer.configure('last 2 versions')

var connectMincer = new ConnectMincer({
  root: path.resolve(__dirname, '../'),
  mincer: Mincer,
  production: process.env.NODE_ENV === 'production',
  mountPoint: 'assets',
  manifestFile: path.resolve(__dirname, '../public/assets/manifest.json'),
  paths: ['assets'],
  assetHost: config.assetHost
})

var env = connectMincer.environment

env.enable('autoprefixer')
env.registerHelper('getConfig', function() {
  return require('./config')
})

module.exports = connectMincer