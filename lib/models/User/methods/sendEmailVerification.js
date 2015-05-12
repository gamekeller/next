var _      = require('lodash')
var uuid   = require('uuid')
var config = require('../../../config')

module.exports = function(userSchema) {
  userSchema.methods.sendEmailVerification = function(mailer, fn, context, ignoreLimits) {
    if(this.emailVerified)
      return fn(config.emailVerification.messages.alreadyVerified)

    if(_.isBoolean(context)) {
      ignoreLimits = context
      context      = undefined
    }

    var sendMail = function(err) {
      if(err)
        return fn(null, err)

      this.emailVerification.sentAt = Date.now()
      if(!ignoreLimits)
        this.emailVerification.resendTries -= 1

      this.save(function(err) {
        if(err)
          return fn(null, err)

        mailer.emailVerification(this.email, _.merge({
          link: config.url + '/account/verify/email/' + this.emailVerification.code,
          username: this.username,
          isRegistration: false
        }, context), function(err) {
          if(err)
            return fn(null, err)

          fn.apply(undefined, [null].concat(Array.prototype.slice.call(arguments)))
        })
      }.bind(this))
    }.bind(this)

    if(!this.emailVerification.code) {
      this.emailVerification = {
        code: uuid.v4(),
        resendTries: 6
      }
      this.save(sendMail)
    } else {
      if(!ignoreLimits) {
        if(this.emailVerification.resendTries <= 0)
          return fn(config.emailVerification.messages.resendThresholdDepleted)
        if(Date.now() - this.emailVerification.sentAt <= config.emailVerification.resendCooldown * 1e3)
          return fn(config.emailVerification.messages.resendOnCooldown)
      }

      sendMail()
    }
  }
}