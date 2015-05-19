// Shamelessly stolen from JS Bin
// See http://git.io/-6YTsA
var fs          = require('fs')
var path        = require('path')
var _           = require('lodash')
var config      = require('../config.default.json')
var md          = require('markdown-it')()
var localConfig = ''

if(process.env.GKNET_CONFIG)
  localConfig = path.resolve(process.cwd(), process.env.GKNET_CONFIG)
if(!fs.existsSync(localConfig))
  localConfig = path.resolve(process.cwd(), 'config.local.json')

if(fs.existsSync(localConfig))
  _.merge(config, require(localConfig))


function importEnvVars(collection, envPrefix) {
  _.forOwn(collection, function(value, key) {
    var envKey = envPrefix + '_' + key.toUpperCase().replace(/[^a-z0-9_]+/gi, '_')
    var envVal = process.env[envKey]

    if(_.isNumber(value) || _.isString(value) || _.isBoolean(value) || value == null) {
      if(envVal && _.isString(envVal)) {
        if(/^\s*(true|on)\s*$/i.test(envVal))
          envVal = true
        else if(/^\s*(false|off)\s*$/i.test(envVal))
          envVal = false
        collection[key] = envVal
      }
    } else if(value && _.isPlainObject(value) && key !== 'blacklist') {
      importEnvVars(value, envKey)
    }
  })
}

function autoRenderMarkdown(collection, shouldRender) {
  _.forOwn(collection, function(value, key) {
    if(shouldRender && _.isString(value))
      collection[key] = md.renderInline(value)
    else if(value && _.isPlainObject(value) && key !== 'blacklist')
      autoRenderMarkdown(value, shouldRender || key === 'messages')
  })
}

importEnvVars(config, 'GKNET')
autoRenderMarkdown(config)

module.exports = config