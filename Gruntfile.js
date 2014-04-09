module.exports = function(grunt) {
  'use strict'

  var mongoose = require('mongoose')
  var bower    = require('bower')
  var secrets  = require('./config/secrets')
  var User     = require('./models/User')
  var Medal    = require('./models/Medal')
  var DBLoaded = false

  function loadDB() {
    if(!DBLoaded) {
      mongoose.connect(secrets.db, secrets.dbOptions)
      mongoose.connection.on('error', function() {
        grunt.fail.fatal('✗ MongoDB Connection Error. Please make sure MongoDB is running.')
      })
      DBLoaded = true
    }
  }

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

  grunt.registerTask('addMedal', 'add a medal to the database', function(name, desc) {
    loadDB()

    var done = this.async()
    var medal =
      new Medal({
        name: name,
        desc: desc,
      })

    medal.save(function(err) {
      if(err) {
        grunt.log.error('Error: ' + err)
        done(false)
      } else {
        grunt.log.writeln('Saved medal: ' + medal.name)
        done()
      }
    })
  })

  grunt.registerTask('seedDB', 'seed the database', function() {
    grunt.task.run('addUser:admin:admin@example.com:admin:true')
    grunt.task.run('addUser:bob:bob@example.com:password:false')
    grunt.task.run('addMedal:foobar:blabla')
    grunt.task.run('addMedal:lewl:testing')
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
    var Mincer = require('mincer')
    var done   = this.async()

    var env = new Mincer.Environment('./')
    env.appendPath('assets')

    var manifest = new Mincer.Manifest(env, './public/assets')
    manifest.compile(['css/main.css', 'js/**/*', 'img/**/*'], function(err, data) {
      grunt.log.writeln('Finished precompilation.')
      done()
    })
  })

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    shell: {
      db: {
        command: 'mongod',
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
  grunt.registerTask('server', ['concurrent:dev'])

  // Database operation tasks.
  grunt.registerTask('db', ['concurrent:dropDB', 'concurrent:seedDB'])
  grunt.registerTask('db.drop', ['concurrent:dropDB'])
  grunt.registerTask('db.seed', ['concurrent:seedDB'])

  // Heroku buildpack task.
  grunt.registerTask('heroku', ['bower', 'precompile', 'dropDB', 'seedDB'])
}