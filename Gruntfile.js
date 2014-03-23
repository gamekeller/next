'use strict'
var mongoose = require('mongoose')
var secrets  = require('./config/secrets')
var dbLoaded = false
var User     = require('./models/User')
var Medal    = require('./models/Medal')

function loadDBSchema() {
  if(dbLoaded === false) {
    mongoose.connect(secrets.db)
    mongoose.connection.on('error', function() {
      console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.')
    })
    dbLoaded = true
  }
}

module.exports = function(grunt) {

  grunt.registerTask('addUser', 'add a user to the database', function(name, email, pass, admin) {
    loadDBSchema()

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
    loadDBSchema()

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
    loadDBSchema()

    var done = this.async()

    mongoose.connection.on('open', function() {
      mongoose.connection.db.dropDatabase(function(err) {
        if(err) {
          grunt.log.error('Error: ' + err)
          done(false)
        } else {
          console.log('Successfully dropped the database')
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

  grunt.registerTask('server', ['concurrent:dev'])

  grunt.registerTask('db.drop', ['concurrent:dropDB'])
  grunt.registerTask('db.seed', ['concurrent:seedDB'])
  grunt.registerTask('db', ['concurrent:dropDB', 'concurrent:seedDB'])
}