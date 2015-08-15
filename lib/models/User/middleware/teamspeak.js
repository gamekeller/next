var _      = require('lodash')
var config = require('../../../config')
var redis  = require('../../../redis')

module.exports = function(userSchema) {
  userSchema.pre('init', function(next, data) {
    if(!data.teamspeakLinked)
      return next()

    redis.$.multi()
      .get('YDL:status')
      .sismember('YDL:online', data.teamspeakUid)
      .hgetall('YDL:data:' + data.teamspeakUid)
      .hgetall('YDL:connections:' + data.teamspeakUid)
      .exec(function(err, res) {
        var health = res[0]
        var status = res[1]
        var info   = res[2]
        var conns  = res[3]
        var clids  = _(conns)
          .keys()
          .map(function(key) {
            var match = key.match(/\d+/)
            return match ? parseInt(match[0], 10) : null
          })
          .compact()
          .uniq()
          .sort(function(a, b) { return a - b })
          .value()

        data.teamspeakOnline      = err || health !== 'OK' ? null : status === 1 ? true : false
        data.teamspeakConnections = []
        data.teamspeakRank        = info ? config.teamspeak.ranks[_.intersection(info.ranks.split(',').reverse(), config.teamspeak.relevantRanks)[0]] : null

        if(!err && health === 'OK' && data.teamspeakOnline)
          _.each(clids, function(clid) {
            data.teamspeakConnections.push({
              clientId: clid,
              nickname: conns['nickname' + clid],
              connectedAt: conns['connectedAt' + clid],
              currentChannel: {
                name: conns['channelName' + clid],
                id: conns['channelId' + clid]
              }
            })
          })

        next(err)
      })
  })

  userSchema.pre('save', function(next) {
    if(!this.isModified('teamspeakUid'))
      return next()

    if(this.teamspeakUid) {
      this.teamspeakLinked = true
    } else {
      this.teamspeakLinked = false
      this.regenerateTeamspeakLinkCode()
    }

    next()
  })
}