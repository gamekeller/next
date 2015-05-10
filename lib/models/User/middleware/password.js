var bcrypt = require('bcryptjs')

module.exports = function(userSchema) {
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
        user.passwordChangedAt = Date.now()
        next()
      })
    })
  })
}