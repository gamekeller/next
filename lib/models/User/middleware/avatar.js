var utils  = require('../../../utils')
var config = require('../../../config')
var UserContent = require('../../../aws').UserContent

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

    var objectsToDelete = [{ Key: config.avatarsPath + '/' + doc.avatar.defaultId }]

    if(doc.avatar.this === 'upload') {
      objectsToDelete.push({ Key: config.avatarsPath + '/' + doc.avatar.id })
    }

    UserContent.deleteObjects({
      Delete: {
        Objects: objectsToDelete
      }
    }, function(err, data) {
      if(err)
        console.error(err)

      next()
    })
  })
}