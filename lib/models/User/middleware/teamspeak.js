var _      = require('lodash-node')
var config = require('../../../config')
var redis  = require('../../../redis')

module.exports = function(userSchema) {
  userSchema.pre('init', function(next, data) {
    if(!data.teamspeakLinked)
      return next()

    redis.$.multi()
      .get('tsStatus')
      .sismember('tsOnline', data.teamspeakUid)
      .hgetall('ts:' + data.teamspeakUid)
      .exec(function(err, res) {
        var health = res[0]
        var status = res[1]
        var info   = res[2]
        var clids  = _(info)
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
        data.teamspeakRank        = config.teamspeak.ranks[_.intersection(info.ranks.split(',').reverse(), config.teamspeak.relevantRanks)[0]]

        if(!err && health === 'OK' && data.teamspeakOnline)
          _.each(clids, function(clid) {
            data.teamspeakConnections.push({
              clientId: clid,
              nickname: info['nickname' + clid],
              connectedAt: info['connectedAt' + clid],
              currentChannel: {
                name: info['channelName' + clid],
                id: info['channelId' + clid]
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