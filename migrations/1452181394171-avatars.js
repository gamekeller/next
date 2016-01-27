'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var utils = require('../lib/utils')
var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')
var ftp = require('../lib/ftp')

exports.up = function(next) {
  connection
  .then(function() {
    return User.find({})
  })
  .then(function(users) {
    ftp.once('ready', function() {
      var done = _.map(users, function(user) {
        return new Promise(function(resolve, reject) {
          console.log('processing user:', user.username)

          user.initAvatar(function(err) {
            if(err)
              return reject(err)

            user.set('gravatarId', undefined, { strict: false })

            user.save(function(err) {
              if(err)
                return reject(err)

              resolve()
            })
          })
        })
      })

      Promise.all(done).then(function() {
        next()
      })
    })
  })
  .catch(function(err) {
    next(err)
  })
}

exports.down = function(next) {
  connection
  .then(function() {
    return User.find({})
  })
  .then(function(users) {
    var done = _.map(users, function(user) {
      delete user.avatar
      user.gravatarId = utils.md5(user.email)
      return user.save()
    })

    Promise.all(done).then(function() {
      next()
    })
  })
  .catch(function(err) {
    next(err)
  })
}