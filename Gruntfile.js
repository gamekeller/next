module.exports = function(grunt) {
  'use strict'

  var fs       = require('fs')
  var exec     = require('child_process').exec
  var mongoose = require('mongoose')
  var bower    = require('bower')
  var secrets  = require('./config/secrets')
  var User     = require('./models/User')
  var DBLoaded = false

  function loadDB() {
    if(!DBLoaded) {
      mongoose.connect(secrets.db)
      mongoose.connection.on('error', function() {
        grunt.fail.fatal('✗ MongoDB Connection Error. Please make sure MongoDB is running.')
      })
      DBLoaded = true
    }
  }

  grunt.registerTask('revupdate', 'update rev info in footer of site', function() {
    var done = this.async()

    exec('git rev-parse HEAD', function(err, rev, stderr) {
      if(err)
        return grunt.fail.fatal(err)
      if(stderr)
        return grunt.fail.fatal(stderr)

      var jade = 'a(href=\'https://github.com/gamekeller/next/commit/' + rev.replace('\n', '') + '\') rev. ' + rev.substr(0, 10)

      fs.writeFile(__dirname + '/views/partials/rev.jade', jade, function(err) {
        if(err)
          return grunt.fail.fatal(err)

        grunt.log.writeln('views/partials/rev.jade updated.')

        done()
      })
    })
  })

  grunt.registerTask('bower', 'install all bower dependencies', function() {
    bower.commands.install()
      .on('log', function(result) {
        grunt.log.writeln(['bower', result.id.cyan, result.message].join(' '))
      })
      .on('error', function(err) { grunt.fail.fatal(error) })
      .on('end', this.async())
  })

  grunt.registerTask('addUser', 'add a user to the database', function(name, email, pass, admin) {
    loadDB()

    var done = this.async()
    var user =
      new User({
        username: name,
        email: email,
        password: pass,
        admin: (admin === 'true')
      })

    user.save(function(err) {
      if(err) {
        grunt.log.error('Error: ' + err)
        done(false)
      } else {
        grunt.log.writeln('Saved user: ' + user.username)
        done()
      }
    })
  })

  grunt.registerTask('seedDB', 'seed the database', function() {
    grunt.task.run('addUser:admin:admin@example.com:admin:true')
    grunt.task.run('addUser:bob:bob@example.com:password:false')
  })

  grunt.registerTask('dropDB', 'drop the database', function() {
    loadDB()

    var done = this.async()

    mongoose.connection.on('open', function() {
      mongoose.connection.db.dropDatabase(function(err) {
        if(err) {
          grunt.fail.fatal('Error: ' + err)
          done(false)
        } else {
          grunt.log.writeln('Successfully dropped the database.')
          done()
        }
      })
    })
  })

  // Mincer asset precompilation
  grunt.registerTask('precompile', function() {
    var rimraf = require('rimraf')
    var Mincer = require('mincer')
    var done   = this.async()

    rimraf.sync('./public/assets')

    var env = new Mincer.Environment('./')

    env.appendPath('assets')

    env.ContextClass.defineAssetPath(function(pathname, options) {
      var asset = this.environment.findAsset(pathname, options)

      if(!asset)
        throw new Error('File ' + pathname + ' not found')

      return '/assets/' + asset.digestPath
    })

    env.jsCompressor  = 'uglify'
    env.cssCompressor = 'csso'

    env = env.index

    var manifest = new Mincer.Manifest(env, './public/assets')
    var toCompile = [
      'css/main.css',
      'css/pages/*',
      'js/main.js',
      'img/*',
      'img/404/*',
      'fonts/*'
    ]

    try {
      var assetsData = manifest.compile(toCompile, { compress: true })
      grunt.log.writeln('Assets were successfully compiled.\nManifest data (a proper JSON) was written to:\n' + manifest.path)
      console.dir(assetsData)
    } catch(err) {
      grunt.fail.fatal('Failed compile assets: ' + (err.message || err.toString()))
    }
  })

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    shell: {
      db: {
        command: 'mongod --dbpath /usr/local/var/mongodb',
        options: {
          async: true
        }
      }
    },

    nodemon: {
      server: {
        script: 'app.js',
        options: {
          ignoredFiles: ['assets/**', 'public/**']
        }
      }
    },

    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      dev: {
        tasks: ['shell', 'nodemon']
      },
      dropDB: {
        tasks: ['shell', 'dropDB']
      },
      seedDB: {
        tasks: ['shell', 'seedDB']
      }
    }

  })

  // Load necessary plugins.
  grunt.loadNpmTasks('grunt-shell-spawn')
  grunt.loadNpmTasks('grunt-nodemon')
  grunt.loadNpmTasks('grunt-concurrent')

  // Development server task.
  grunt.registerTask('server', ['revupdate', 'concurrent:dev'])

  // Database operation tasks.
  grunt.registerTask('db', ['concurrent:dropDB', 'concurrent:seedDB'])
  grunt.registerTask('db.drop', ['concurrent:dropDB'])
  grunt.registerTask('db.seed', ['concurrent:seedDB'])
}