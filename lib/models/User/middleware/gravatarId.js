var crypto = require('crypto')

module.exports = function(userSchema) {
  userSchema.pre('save', function(next) {
    if(!this.isModified('email'))
      return next()

    this.gravatarId = crypto.createHash('md5').update(this.email).digest('hex').toString()
    next()
  })
}