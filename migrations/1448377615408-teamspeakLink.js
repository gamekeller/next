'use strict'

var Promise = require('bluebird')
var mongoose = require('mongoose')
var config = require('../lib/config')
var User = require('../lib/models/User')

var connection = new Promise(function(resolve, reject) {
  mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db)

  mongoose.connection.on('error', function(err) {
    console.error('✗ Unable to connect to MongoDB.')
    reject(err)
  })

  mongoose.connection.on('connected', function() {
    console.log('✔ MongoDB connection established.')
    resolve(mongoose.connection)
  })
})

exports.up = function(next) {
  connection
  .then(function() {
    return User.update({}, { $unset: { teamspeakLink: 1 } }, { strict: false, multi: true })
  })
  .then(function() {
    next()
  })
  .catch(function(err) {
    next(err)
  })
}

exports.down = function(next) {
  next()
}