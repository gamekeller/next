'use strict'

var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')

exports.up = function(next) {
  connection
  .then(function() {
    return User.update({ teamspeakUid: '' }, { $unset: { teamspeakUid: 1 } }, { multi: true })
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