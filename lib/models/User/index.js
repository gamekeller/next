var userSchema = require('./schema')

/**
 * Mount middleware
 */
require('./middleware/gravatarId')(userSchema)
require('./middleware/password')(userSchema)
require('./middleware/bio')(userSchema)
require('./middleware/teamspeak')(userSchema)

/**
 * Add methods
 */
require('./methods/comparePassword')(userSchema)
require('./methods/gravatarUrl')(userSchema)
require('./methods/sendEmailVerification')(userSchema)
require('./methods/sendPasswordReset')(userSchema)
require('./methods/getSessions')(userSchema)
require('./methods/log')(userSchema)
require('./methods/saveAndLogChanges')(userSchema)
require('./methods/friendsWith')(userSchema)
require('./methods/rank')(userSchema)

/**
 * Make into model and export
 */
var User = module.exports = require('mongoose').model('User', userSchema)

User.schema.path('username').validate(function(username, done) {
  if(!this.isModified('username'))
    return done()

  User.findOne({ username: username.toLowerCase() }, function(err, user) {
    if(err || user)
      return done(false)

    done(true)
  })
}, 'Username "{VALUE}" wird in ähnlicher Form bereits verwendet.')