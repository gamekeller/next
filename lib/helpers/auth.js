var _ = require('lodash')

module.exports = function(app) {
  var request = app.request
  var login   = request.login
  var logout  = request.logout

  request.logIn = request.login = function(user, callback) {
    if(!_.contains(user.sessions, this.session.id))
      user.sessions.push(this.session.id)

    user.log('user.login', this.session, function(err, user) {
      if(err)
        return callback(err)

      login.call(this, user, callback)
    }.bind(this))
  }

  request.logOut = request.logout = function(callback) {
    this.user.sessions = _.without(this.user.sessions, this.session.id)

    var returnTo = this.session.returnTo

    this.user.save(function(err) {
      if(err)
        return callback(err)

      logout.call(this)
      this.session.regenerate(function(err) {
        if(err)
          return callback(err)

        this.session.returnTo = returnTo
        callback(null)
      }.bind(this))
    }.bind(this))
  }
}