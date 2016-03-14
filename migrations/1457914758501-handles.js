'use strict'

var config = require('../lib/config')
var User = require('../lib/models/User')
var Handle = require('../lib/models/Handle')
var connection = require('../lib/mongo')

exports.up = function(next) {
  connection
  .then(function() {
    return User.find({})
  })
  .each(function(user) {
    user.handle = new Handle({
      path: user.username.toLowerCase(),
      target: {
        id: user._id,
        type: 'user'
      }
    })

    return user.handle.save().then(user.save)
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