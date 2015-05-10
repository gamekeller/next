var fs     = require('fs')
var path   = require('path')
var Mincer = require('mincer')

module.exports = function(grunt) {
  grunt.registerTask('precompile', 'precompile assets for production', function() {
    var done = this.async()
    var cwd  = process.cwd()

    Mincer.MacroProcessor.configure(['.less', '.js'])
    Mincer.Autoprefixer.configure('last 2 version')

    var env = new Mincer.Environment(cwd)

    env.enable('autoprefixer')

    env.appendPath('assets')

    env.ContextClass.defineAssetPath(function(pathname, options) {
      var asset = this.environment.findAsset(pathname, options)

      if(!asset)
        throw new Error('File ' + pathname + ' not found')

      return '/assets/' + asset.digestPath
    })

    env.registerHelper('getConfig', function() {
      return require('../lib/config')
    })

    env.jsCompressor  = 'uglify'
    env.cssCompressor = 'csswring'

    env = env.index

    var manifest = new Mincer.Manifest(env, path.resolve(cwd, 'public/assets'))
    var toCompile = [
      'css/main.css',
      'css/pages/*',
      'js/main.js',
      'js/pages/*',
      'img/*',
      'img/**/*',
      'fonts/*.woff',
      'fonts/*.woff2'
    ]

    try {
      var assetsData = manifest.compile(toCompile)
      grunt.log.writeln('Assets were successfully compiled.\nManifest data (a proper JSON) was written to:\n' + manifest.path)
      console.dir(assetsData)
      done()
    } catch(err) {
      grunt.fail.fatal('Failed compile assets: ' + (err.message || err.toString()))
      done(false)
    }
  })
}