var utils = require('../../../utils')

module.exports = function(userSchema) {
  userSchema.pre('save', function(next) {
    if(!this.isModified('email') || this.avatar.type !== 'gravatar')
      return next()

    this.avatar.id = utils.md5(this.email)
    next()
  })

  userSchema.pre('save', function(next) {
    if(!this.isNew)
      return next()

    this.initAvatar(next)
  })
}