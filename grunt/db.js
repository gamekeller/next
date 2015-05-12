var mongoose  = require('mongoose')
var secrets   = require('../lib/config').secrets
var connected = false
var redis
var User

module.exports = function(grunt) {
  function connect(callback) {
    if(!connected) {
      mongoose.connect(secrets.db)
      redis = require('../lib/redis')
      mongoose.connection.on('open', function() {
        User = require('../lib/models/User')
        connected = true
        callback()
      })
    } else {
      callback()
    }
  }

  grunt.registerTask('addUser', 'add a user to the database', function(name, email, pass, admin) {
    var done = this.async()

    connect(function() {
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
  })

  grunt.registerTask('dropDB', 'drop the database', function() {
    var done  = this.async()

    connect(function() {
      mongoose.connection.db.dropDatabase(function(err) {
        if(err) {
          grunt.fail.fatal('Error: ' + err)
          done(false)
        } else {
          grunt.log.writeln('Successfully dropped Mongo database.')

          redis.$.flushdb()
          redis.$.quit()

          grunt.log.writeln('Successfully dropped Redis database.')

          done()
        }
      })
    })
  })

  grunt.registerTask('seedDB', 'seed the database', function() {
    grunt.task.run('addUser:master:master@example.com:master:true')
    grunt.task.run('addUser:bob:bob@example.com:password:false')
    grunt.log.writeln('Adding users "master" and "bob" to the DB.')
  })
}