var _      = require('lodash')
var uuid   = require('uuid')
var config = require('../../../config')

function sendMail(mailer, context, ignoreLimits) {
  var user = this

  user.emailVerification.sentAt = Date.now()

  if(!ignoreLimits)
    user.emailVerification.resendTries -= 1

  return user.save()
  .then(function() {
    return mailer.send(
      {
        to: user.email,
        from: config.mail.senders.accounts,
        subject: config.mail.subjects.emailVerification,
        template: 'emailVerification'
      }, _.merge({
        link: config.url + '/account/verify/email/' + user.emailVerification.code,
        username: user.username,
        isRegistration: false
      }, context)
    )
  })
}

module.exports = function(userSchema) {
  userSchema.methods.sendEmailVerification = function(mailer, callback, context, ignoreLimits) {
    if(this.emailVerified)
      return callback(config.emailVerification.messages.alreadyVerified)

    if(_.isBoolean(context)) {
      ignoreLimits = context
      context      = undefined
    }

    if(!this.emailVerification.code) {
      this.emailVerification = {
        code: uuid.v4(),
        resendTries: 6
      }
    } else if(!ignoreLimits) {
      if(this.emailVerification.resendTries <= 0)
        return callback(config.emailVerification.messages.resendThresholdDepleted)
      if(Date.now() - this.emailVerification.sentAt <= config.emailVerification.resendCooldown * 1e3)
        return callback(config.emailVerification.messages.resendOnCooldown)
    }

    sendMail.call(this, mailer, context, ignoreLimits)
    .then(function() {
      callback()
    }, function(err) {
      callback(null, err)
    })
  }
}