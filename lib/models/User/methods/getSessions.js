var _        = require('lodash')
var Promise  = require('bluebird')
var platform = require('platform')
var redis    = require('../../../redis')
var utils    = require('../../../utils')

module.exports = function(userSchema) {
  userSchema.methods.getSessions = function(currentSid, callback) {
    var sessions    = []
    var getSessions = _.map(this.sessions, function(sid, index) {
      return redis.getSessionById(sid).then(function(result) {
        if(!result)
          return Promise.resolve()

        var session = {
          id: sid,
          session: result
        }

        if(result.usedAt)
          session.recentlyUsed = Date.now() - result.usedAt < 300 * 1e3

        if(result.userAgent) {
          session.isMobile = utils.isMobileUserAgent(result.userAgent)
          session.isTablet = utils.isTabletUserAgent(result.userAgent)
          session.platform = platform.parse(result.userAgent)
        }

        sessions.push(session)

        return Promise.resolve()
      })
    })

    Promise.all(getSessions).then(function() {
      sessions = _.sortBy(sessions, function(session) {
        if(session.id === currentSid)
          return 0

        if(session.recentlyUsed)
          return 1

        return 2
      })
      callback(null, sessions)
    }).catch(callback)
  }
}