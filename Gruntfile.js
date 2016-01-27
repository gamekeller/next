module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    nodemon: {
      server: {
        script: 'app.js',
        debug: true,
        options: {
          ignoredFiles: ['assets/**', 'public/**', 'uploads/**', 'node_modules/**']
        }
      },
      prod: {
        script: 'app.js',
        options: {
          env: {
            SIMULATE_PRODUCTION: true,
            NODE_ENV: 'production'
          }
        }
      }
    },

    external_daemon: {
      redis: {
        cmd: 'redis-server',
        args: ['/usr/local/etc/redis.conf']
      },
      mongodb: {
        options: {
          startCheck: function(stdout, stderr) {
            return /waiting for connections/.test(stdout)
          }
        },
        cmd: 'mongod',
        args: ['--dbpath', '/usr/local/var/mongodb']
      }
    },

    'ftp-deploy': {
      deploy: {
        auth: {
          host: 'ftp.keycdn.com',
          port: 21,
          authKey: 'keycdn'
        },
        src: 'public/assets',
        dest: 'gk/assets',
        exclusions: ['public/assets/manifest.json']
      }
    }

  })

  // Load local grunt tasks.
  grunt.loadTasks('grunt')

  // Load necessary plugins.
  grunt.loadNpmTasks('grunt-nodemon')
  grunt.loadNpmTasks('grunt-external-daemon')
  grunt.loadNpmTasks('grunt-ftp-deploy')

  // Development server task.
  grunt.registerTask('server', ['revupdate', 'external_daemon', 'nodemon:server'])

  // Production simulating task.
  grunt.registerTask('prod', ['revupdate', 'precompile', 'external_daemon', 'nodemon:prod'])

  // Database operation tasks.
  grunt.registerTask('db', ['external_daemon', 'dropDB', 'seedDB'])
  grunt.registerTask('db.drop', ['external_daemon', 'dropDB'])
  grunt.registerTask('db.seed', ['external_daemon', 'seedDB'])

  // Deploy task.
  grunt.registerTask('deploy', ['bower', 'precompile', 'ftp-deploy', 'revupdate'])

  // Default task.
  grunt.registerTask('default', ['server'])
}