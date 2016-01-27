var Promise = require('bluebird')
var crypto = require('crypto')
var got = require('got')
var Identicon = require('identicon-github')
var ftp = require('../../../ftp')
var utils = require('../../../utils')

function randomName() {
  return crypto.randomBytes(16).toString('hex')
}

module.exports = function(userSchema) {
  userSchema.methods.initAvatar = function(cb) {
    var user = this
    var hashedEmail = utils.md5(user.email)
    var identicon = Identicon(user.username, {
      bgColor: '#f0f0f0',
      imagePadding: 52,
      pixelPadding: -1,
      pixelSize: 68,
      tiles: 6
    })

    user.avatar.defaultId = randomName() + '.png'

    ftp.put(identicon.toBuffer(), 'avatars/' + user.avatar.defaultId, function(err) {
      if(err)
        return cb(err)

      got('https://www.gravatar.com/avatar/' + hashedEmail + '?d=404')
      .then(function() {
        user.avatar.type = 'gravatar'
        user.avatar.id = hashedEmail

        cb()
      })
      .catch(function(err) {
        if(err.statusCode !== 404)
          return cb(err)

        user.avatar.type = 'default'

        cb()
      })
    })
  }
}