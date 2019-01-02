'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var mongoose = require('mongoose')
var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')

exports.up = function(next) {
  var usersById

  connection
  .then(function() {
    return User.find({}, '_id', { lean: true })
  })
  .then(function(existingUsers) {
    usersById = _.map(existingUsers, '_id')

    return User.find({ 'friends.0': { $exists: true } }, 'friends', { lean: true })
  })
  .each(function(user) {
    console.log('processing user', user._id)

    user.friends = _.intersectionWith(user.friends, usersById, function(val, other) {
      return val.equals(other)
    })

    return User.updateOne({ _id: user._id }, { $set: { friends: user.friends } })
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