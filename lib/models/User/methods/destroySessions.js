var _     = require('lodash')
var redis = require('../../../redis')

module.exports = function(userSchema) {
  userSchema.methods.destroySessions = function(exceptions) {
    if(exceptions && !_.isArray(exceptions))
      return

    var user = this
    var sessions = _.without(user.sessions, exceptions)

    user.sessions = _.intersection(user.sessions, exceptions)

    return redis.deleteSessionsById(sessions)
    .then(function() {
      return user.save()
    })
    .catch(function(err) {
      console.error(err)
      return err
    })
  }
}