module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    aws: grunt.file.readJSON('.aws-deploy.json'),
    s3: {
      options: {
        accessKeyId: '<%= aws.accessKeyId %>',
        secretAccessKey: '<%= aws.secretAccessKey %>',
        bucket: 'gamekeller',
        region: 'eu-central-1',
        gzip: false,
        overwrite: false,
        access: 'private'
      },
      assets: {
        cwd: 'public/',
        src: ['assets/**', '!assets/manifest.json']
      }
    }
  })

  // Load local grunt tasks.
  grunt.loadTasks('grunt')

  // Load necessary plugins.
  grunt.loadNpmTasks('grunt-aws')

  // Production simulating task.
  grunt.registerTask('prod', ['revupdate', 'precompile'])

  // Database operation tasks.
  grunt.registerTask('db', ['dropDB', 'seedDB'])
  grunt.registerTask('db.drop', ['dropDB'])
  grunt.registerTask('db.seed', ['seedDB'])

  // Deploy task.
  grunt.registerTask('deploy', ['bower', 'precompile', 's3', 'revupdate'])
}