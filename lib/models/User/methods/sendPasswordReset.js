var _      = require('lodash')
var uuid   = require('uuid')
var config = require('../../../config')

function sendMail(mailer, context, ignoreLimits) {
  var user = this

  user.forgotPassword.sentAt = Date.now()

  if(!ignoreLimits)
    user.forgotPassword.resendTries -= 1

  return user.save()
  .then(function() {
    return mailer.send(
      {
        to: user.email,
        from: config.mail.senders.accounts,
        subject: config.mail.subjects.forgotPassword,
        template: 'forgotPassword'
      }, _.merge({
        link: config.url + '/forgot/' + user.forgotPassword.code,
        username: user.username
      }, context)
    )
  })
}

module.exports = function(userSchema) {
  userSchema.methods.sendPasswordReset = function(mailer, callback, context, ignoreLimits) {
    if(_.isBoolean(context)) {
      ignoreLimits = context
      context      = undefined
    }

    if(!this.forgotPassword.code) {
      this.forgotPassword = {
        resendTries: 6
      }
    } else if(!ignoreLimits) {
      if(this.forgotPassword.resendTries <= 0)
        return callback(config.forgotPassword.messages.resendThresholdDepleted)
      if(Date.now() - this.forgotPassword.sentAt <= config.forgotPassword.resendCooldown * 1e3)
        return callback(config.forgotPassword.messages.resendOnCooldown)
    }

    this.forgotPassword.code = uuid.v4()

    sendMail.call(this, mailer, context, ignoreLimits)
    .then(function() {
      callback()
    }, function(err) {
      callback(null, err)
    })
  }
}