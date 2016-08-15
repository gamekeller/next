var bower = require('bower')

module.exports = function(grunt) {
  grunt.registerTask('bower', 'install all bower dependencies', function() {
    bower.commands.install()
      .on('log', function(result) {
        grunt.log.writeln(['bower', result.id.cyan, result.message].join(' '))
      })
      .on('error', function(err) { grunt.fail.fatal(err) })
      .on('end', this.async())
  })
}