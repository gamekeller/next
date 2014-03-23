var mongoose         = require('mongoose')
var bcrypt           = require('bcryptjs')
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

module.exports = mongoose.model('User', userSchema)