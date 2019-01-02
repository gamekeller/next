var Promise = require('bluebird')
var _       = require('lodash')
var config  = require('../../../config')
var redis   = require('../../../redis')

module.exports = function(userSchema) {
  // TODO: rewrite this (async getters?, methods?)
  function teamspeakDataHandler(doc, next) {
    if(!doc || !doc.teamspeakLinked)
      return next()

    redis.$.multi()
      .get('YDL:status')
      .sismember('YDL:online', doc.teamspeakUid)
      .hgetall('YDL:data:' + doc.teamspeakUid)
      .smembers('YDL:connections:' + doc.teamspeakUid + ':clids')
      .hgetall('YDL:connections:' + doc.teamspeakUid)
      .exec(function(err, res) {
        var health = res[0]
        var status = res[1]
        var info   = res[2]
        var clids  = res[3]
        var conns  = res[4]

        doc.teamspeakOnline      = err || health !== 'OK' ? null : status === 1 ? true : false
        doc.teamspeakConnections = []
        doc.teamspeakTracking    = {}

        if(!err && health === 'OK') {
          if(info && info.activeTime) doc.teamspeakTracking.activeTime = info.activeTime
          if(info && info.onlineTime) doc.teamspeakTracking.onlineTime = info.onlineTime
          if(info && info.lastSeen) doc.teamspeakTracking.lastSeen = info.lastSeen

          if(doc.teamspeakOnline) {
            _.each(clids, function(clid) {
              doc.teamspeakConnections.push({
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
  }

  userSchema
    .post('findOne', teamspeakDataHandler)
    .post('findOneAndUpdate', teamspeakDataHandler)

  userSchema.post('find', function (docs, next) {
    Promise.all(
      _.map(docs, function(doc) {
        return new Promise(function(res, rej) {
          teamspeakDataHandler(doc, function(err) {
            if (err) return rej(err)
            res()
          })
        })
      })
    ).then(function() {
      next()
    }).catch(next)
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