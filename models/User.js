var _        = require('lodash')
var mongoose = require('mongoose')
var bcrypt   = require('bcryptjs')
var crypto   = require('crypto')

/**
 * User schema
 */
var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  admin: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now, required: true },

  profile: {}
})

/**
 * Bcrypt middleware
 */
userSchema.pre('save', function(next) {
  var user = this

  if(!user.isModified('password'))
    return next()

  bcrypt.genSalt(10, function(err, salt) {
    if(err)
      return next(err)

    bcrypt.hash(user.password, salt, function(err, hash) {
      if(err)
        return next(err)

      user.password = hash
      next()
    })
  })
})

/**
 * Password validation
 */
userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err)
      return callback(err)

    callback(null, isMatch)
  })
}

/**
 * Get Gravatar URL
 */
userSchema.methods.gravatar = function(size, defaults) {
  size     = size || 200
  defaults = defaults || 'retro'

  var base  = 'https://0.gravatar.com/avatar/'
  var query = '?s=' + size + '&d=' + defaults + '&r=pg'

  return base + (this.email ? crypto.createHash('md5').update(this.email).digest('hex').toString() : '') + query
}

module.exports = mongoose.model('User', userSchema)