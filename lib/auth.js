var error         = require('./error')
var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy
var User          = require('./models/User')

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, done)
})

/**
 * Sign in using username and password
 */
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if(err)
      return done(err)

    if(!user)
      return done(null, false, { error: 'userNotFound', message: 'Nutzer "' + username + '" wurde nicht gefunden.' })

    user.comparePassword(password, function(err, isMatch) {
      if(err)
        return done(err)

      if(isMatch)
        return done(null, user)
      else
        return done(null, user, { error: 'wrongPassword', message: 'Falsches Passwort.' })
    })
  })
}))

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if(!req.isAuthenticated())
    return res.returnWith('error', 'Du musst eingeloggt sein.', '/login')

  next()
}

/**
 * Admin required middleware
 */
exports.ensureAdmin = function(req, res, next) {
  if(req.user && req.user.admin === true)
    next()
  else
    next(new error.NotFound)
}