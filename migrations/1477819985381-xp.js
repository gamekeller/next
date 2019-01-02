'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var mongoose = require('mongoose')
var config = require('../lib/config')
var User = require('../lib/models/User')
var connection = require('../lib/mongo')
var redis = require('../lib/redis')

const rankMigration = {
  1: 100,
  2: 200,
  3: 300,
  4: 9800,
  5: 9900
}

exports.up = function(next) {
  connection
  .then(function() {
    // Initialize XP
    return User.updateMany({
      level: { $exists: false }
    }, {
      level: 1,
      xp: {
        current: 0,
        total: 0,
        boostMinutesRemaining: config.xp.gains.boostDuration
      }
    })
  })
  .then(function() {
    return User.find({}, '_id createdAt', { lean: true })
  })
  .map(function(user) {
    return User.updateOne({ _id: user._id }, { $set: { 'xp.lastPromotionAt': user.createdAt } })
  })
  .then(function() {
    // Mitigate ranks
    return Promise.all(
      _.map(rankMigration, function(newRank, oldRank) {
        return User.updateMany({ rank: oldRank }, { $set: { rank: newRank } })
      })
    )
  })
  .then(function() {
    // Set rank 0 for all users without ranks
    return User.updateMany({ rank: { $exists: false } }, { $set: { rank: 0 } })
  })
  .then(function() {
    // Get all users with linked TeamSpeak
    return User.find({ teamspeakLinked: true }, 'teamspeakUid username', { lean: true })
  })
  .map(function(user) {
    // Get the TeamSpeak data for each user
    return new Promise(function(resolve, reject) {
      redis.$.hget('YDL:data:' + user.teamspeakUid, 'activeTime', function(err, data) {
        user.activeTime = data
        resolve(user)
      })
    })
  })
  .map(function(user) {
    // Transfer active TeamSpeak time to XP within bounds
    var totalXp = Math.round((((user.activeTime / 1000) / 60) * config.xp.gains.eachTick) / 20) * 20
    var xp = totalXp
    var level = 1

    for(var i = 1; i < config.xp.rampUpDoneAtLevel; i++) {
      if(xp - config.xp.levelXpKey[i] >= 0) {
        xp -= config.xp.levelXpKey[i]
        level++
      } else {
        break
      }
    }

    if(level === config.xp.rampUpDoneAtLevel && (xp / config.xp.levelXpKey.default) >= 1) {
      level += Math.floor(xp / config.xp.levelXpKey.default)
      xp %= config.xp.levelXpKey.default
    }

    return User.updateOne({ _id: user._id }, {
      $set: {
        level: level,
        'xp.total': totalXp,
        'xp.current': xp
      }
    })
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