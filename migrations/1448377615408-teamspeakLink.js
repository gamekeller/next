'use strict'

var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')

exports.up = function(next) {
  connection
  .then(function() {
    return User.updateMany({}, { $unset: { teamspeakLink: 1 } }, { strict: false })
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