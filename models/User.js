var mongoose         = require('mongoose')
var bcrypt           = require('bcryptjs')
var crypto           = require('crypto')
var ObjectId         = mongoose.Schema.ObjectId
var SALT_WORK_FACTOR = 10

/**
 * User schema
 */
var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true},
  admin: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now, required: true },

  profile: {
    medals: [{ id: ObjectId, date: Date }]
  }
})

/**
 * Bcrypt middleware
 */
userSchema.pre('save', function(next) {
  var user = this

  if(!user.isModified('password'))
    return next()

  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
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

  if(!this.email)
    return 'https://0.gravatar.com/avatar/?s=' + size + '&d=' + defaults

  var md5 = crypto.createHash('md5').update(this.email)
  return 'https://gravatar.com/avatar/' + md5.digest('hex').toString() + '?s=' + size + '&d=' + defaults
}

module.exports = mongoose.model('User', userSchema)