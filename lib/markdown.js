var utils = require('./utils')
var md    = require('markdown-it')({
  breaks: true,
  linkify: true
})

var defaultRender = md.renderer.rules.image

md.renderer.rules.image = function(tokens, idx, options, env, self) {
  tokens[idx].attrs[0][1] = utils.convertToCamoUrl(tokens[idx].attrs[0][1])

  return defaultRender(tokens, idx, options, env, self)
}

module.exports = function(text) {
  return md.render(text)
}