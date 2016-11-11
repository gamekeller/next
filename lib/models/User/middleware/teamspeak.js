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
      .smembers('YDL:connections:' + data.teamspeakUid + ':clids')
      .hgetall('YDL:connections:' + data.teamspeakUid)
      .exec(function(err, res) {
        var health = res[0]
        var status = res[1]
        var info   = res[2]
        var clids  = res[3]
        var conns  = res[4]

        data.teamspeakOnline      = err || health !== 'OK' ? null : status === 1 ? true : false
        data.teamspeakConnections = []
        data.teamspeakTracking    = {}

        if(!err && health === 'OK') {
          if(info && info.activeTime) data.teamspeakTracking.activeTime = info.activeTime
          if(info && info.onlineTime) data.teamspeakTracking.onlineTime = info.onlineTime
          if(info && info.lastSeen) data.teamspeakTracking.lastSeen = info.lastSeen

          if(data.teamspeakOnline) {
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
          }
        }

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
    }

    next()
  })
}