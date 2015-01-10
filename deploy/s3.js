var fs   = require('fs')
var path = require('path')
var P    = require('bluebird')
var AWS  = require('aws-sdk')
var mime = require('mime-types')
var glob = P.promisify(require('glob'))

AWS.config.update({
  region: 'eu-west-1',
  sslEnabled: true
})

var bucket = new AWS.S3({ params: { Bucket: 'gamekeller' } })

glob('public/assets/!(manifest)/**/*')
  .map(function(filename) {
    return new P(function(resolve, reject) {
      bucket.putObject({
        ACL: 'public-read',
        CacheControl: 'max-age=31556926',
        ContentType: mime.lookup(path.extname(filename)),
        Key: filename.replace('public/', ''),
        Body: fs.createReadStream(filename)
      }, function(err, data) {
        if(err) return reject(err)
        resolve(data)
      })
    })
  })
  .then(function() {
    console.log('Success!')
    process.exit(0)
  })
  .catch(function(err) {
    console.error(err)
    process.exit(1)
  })