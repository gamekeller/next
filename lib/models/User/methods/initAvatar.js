var Promise = require('bluebird')
var crypto = require('crypto')
var got = require('got')
var Identicon = require('identicon-github')
var config = require('../../../config')
var UserContent = require('../../../aws').UserContent
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

    UserContent.upload({ Key: config.avatarsPath + '/' + user.avatar.defaultId, Body: identicon.toBuffer(), ContentType: 'image/png' }, function(err, data) {
      if(err)
        return cb(err)

      got('https://www.gravatar.com/avatar/' + hashedEmail + '?d=404')
      .then(function() {
        user.avatar.type = 'gravatar'
        user.avatar.id = hashedEmail

        cb()
      })
      .catch(function(err) {
        if(err.statusCode !== 404) {
          console.error(err)
        }

        user.avatar.type = 'default'

        cb()
      })
    })
  }
}