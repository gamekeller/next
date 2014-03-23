var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy
var User          = require('../models/User')

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

/**
 * Sign in using username and password
 */
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if(err)
      return done(err)

    if(!user)
      return done(null, false, { message: 'Unknown user ' + username })

    user.comparePassword(password, function(err, isMatch) {
      if(err)
        return done(err)

      if(isMatch)
        return done(null, user)
      else
        return done(null, false, { message: 'Invalid password' })
    })
  })
}))

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
  if(req.isAuthenticated())
    return next()

  res.redirect('/login')
}

/**
 * Admin required middleware
 */
exports.ensureAdmin = function(req, res, next) {
  return function(req, res, next) {
    if(req.user && req.user.admin === true)
       next()
    else
      res.send(403)
  }
}