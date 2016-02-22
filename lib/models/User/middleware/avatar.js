var utils  = require('../../../utils')
var config = require('../../../config')
var ftp    = require('../../../ftp')

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

  userSchema.post('remove', function(doc, next) {
    if(!doc.avatar)
      return next()

    ftp.delete(config.avatarsPath + '/' + doc.avatar.defaultId, function(err) {
      if(err)
        return next(err)

      if(doc.avatar.type === 'upload') {
        ftp.delete(config.avatarsPath + '/' + doc.avatar.id, function(err) {
          if(err)
            return next(err)

          next()
        })
      } else {
        next()
      }
    })
  })
}