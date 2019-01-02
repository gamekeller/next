var _       = require('lodash')
var Promise = require('bluebird')
var Agenda  = require('agenda')
var config  = require('./config')
var redis   = require('./redis')
var User    = require('./models/User')

exports.resetBoost = function resetBoost() {
  return User.update({}, { $set: { 'xp.boostMinutesRemaining': config.xp.gains.boostDuration } }, { multi: true })
}

exports.giveOutXP = function giveOutXP(users) {
  var bulk = User.collection.initializeUnorderedBulkOp()

  // XP for users with boost remaining
  bulk.find({
    teamspeakUid: { $in: users },
    'xp.boostMinutesRemaining': { $gt: 0 }
  }).update({
    $inc: {
      'xp.current': config.xp.gains.eachTickBoosted,
      'xp.total': config.xp.gains.eachTickBoosted,
      'xp.boostMinutesRemaining': -1
    }
  })

  // XP for users with depleted boost
  bulk.find({
    teamspeakUid: { $in: users },
    'xp.boostMinutesRemaining': 0
  }).update({
    $inc: {
      'xp.current': config.xp.gains.eachTick,
      'xp.total': config.xp.gains.eachTick
    }
  })

  return bulk.execute().catch(function(err) {
    console.error(err)
  })
}

exports.checkForLevelups = function checkForLevelups() {
  var bulk = User.collection.initializeUnorderedBulkOp()

  _.each(config.xp.levelXpKey, function(xp, level) {
      bulk.find({
        level: (level === config.xp.levelXpKey.length - 1) ? { $gte: config.xp.levelXpKey.length } : level + 1,
        'xp.current': { $gte: xp }
      }).update({
        $inc: { level: 1 },
        $set: { 'xp.current': 0 }
      })
  })

  return bulk.execute().catch(function(err) {
    console.error(err)
  })
}

var agenda = new Agenda({
  db: {
    address: config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db,
    options: {
      useNewUrlParser: true
    }
  }
})

agenda.define('XP: give out', function(job, done) {
  redis.getOnlineTeamSpeakUsers()
  .then(exports.giveOutXP)
  .then(exports.checkForLevelups)
  .then(done)
})

agenda.define('XP: reset boost', function(job, done) {
  exports.resetBoost().then(done)
})

agenda.on('ready', function() {
  agenda.every('* * * * *', 'XP: give out')
  agenda.every('0 3 * * *', 'XP: reset boost')

  agenda.start()
})