var bcrypt = require('bcryptjs')

module.exports = function(userSchema) {
  userSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if(err)
        return callback(err)

      callback(null, isMatch)
    })
  }

  userSchema.methods.comparePasswordSync = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password)
  }
}