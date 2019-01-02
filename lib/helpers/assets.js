var path = require('path')
var config = require('../config')

module.exports = function(app) {
  var isProd = app.get('env') === 'production'
  var manifest = isProd ? require(path.resolve(process.cwd(), 'public/assets/manifest.json')) : {}

  app.locals.asset = function(asset) {
    return (config.assetHost ? 'https://' + config.assetHost : '') + '/assets/' + (manifest[asset] || asset)
  }
}