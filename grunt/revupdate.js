var fs   = require('fs')
var path = require('path')
var exec = require('child_process').exec

module.exports = function(grunt) {
  grunt.registerTask('revupdate', 'update rev info in footer of site', function() {
    var done = this.async()

    exec('git rev-parse HEAD', function(err, rev, stderr) {
      if(err || stderr) {
        grunt.fail.fatal(err || stderr)
        done(false)
      }

      var jade = 'a.footer-rev(href=\'https://github.com/gamekeller/next/commit/' + rev.replace('\n', '') + '\') rev. ' + rev.substr(0, 10)

      fs.writeFile(path.resolve(process.cwd(), 'views/partials/rev.jade'), jade, function(err) {
        if(err) {
          grunt.fail.fatal(err)
          done(false)
        }

        grunt.log.writeln('views/partials/rev.jade updated.')

        done()
      })
    })
  })
}