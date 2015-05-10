var utils = require('./utils')
var md    = require('markdown-it')()

var defaultRender = md.renderer.rules.image

md.renderer.rules.image = function(tokens, idx, options, env, self) {
 tokens[idx].src = utils.convertToCamoUrl(tokens[idx].src)

  return defaultRender(tokens, idx, options, env, self)
}

module.exports = function(text) {
  return md.render(text)
}