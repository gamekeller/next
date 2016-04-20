'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')
var redis = require('../lib/redis')

var ranks = {
  '7': 1,
  '9': 2,
  '10': 3,
  '11': 4,
  '6': 5,
}
var relevantRanks = _.keys(ranks)

exports.up = function(next) {
  connection
  .then(function() {
    return User.find({ teamspeakLinked: true })
  })
  .map(function(user) {
    return new Promise(function(resolve, reject) {
      redis.$.hgetall('YDL:data:' + user.teamspeakUid, function(err, data) {
        user.tsData = data
        resolve(user)
      })
    })
  })
  .map(function(user) {
    var rank = 1

    if(user.tsData && user.tsData.ranks && user.tsData.ranks !== '8') {
      var tsRank = _.intersection(user.tsData.ranks.split(',').reverse(), relevantRanks)[0]
      rank = ranks[tsRank]
    }

    return User.update({ _id: user.id }, { rank: rank })
  })
  .then(function() {
    next()
  })
  .catch(function(err) {
    next(err)
  })
}

exports.down = function(next) {
  connection
  .then(function() {
    return User.update({ teamspeakLinked: true }, { $unset: { rank: true } })
  })
  .then(function() {
    next()
  })
  .catch(function(err) {
    next(err)
  })
}