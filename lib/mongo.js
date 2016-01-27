var Promise = require('bluebird')
var mongoose = require('mongoose')
var config = require('./config')

mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db)

module.exports = new Promise(function(resolve, reject) {
  mongoose.connection.on('connected', function() {
    console.log('✔ MongoDB connection established.')
    resolve()
  })
  mongoose.connection.on('error', function(err) {
    console.error('✗ Unable to connect to MongoDB.')
    reject(err)
  })
})