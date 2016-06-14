var config = require('./config')
var AWS = exports.AWS = require('aws-sdk')

AWS.config.update({
  sslEnabled: true,
  region: 'eu-central-1',
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey
})

AWS.config.setPromisesDependency(require('bluebird'))

exports.UserContent = new AWS.S3({ params: { Bucket: config.aws.buckets.userContent } })