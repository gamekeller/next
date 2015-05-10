var merge     = require('lodash-node/modern/objects/merge')
var isBoolean = require('lodash-node/modern/objects/isBoolean')
var uuid      = require('uuid')
var config    = require('../../../config')

module.exports = function(userSchema) {
  userSchema.methods.sendPasswordReset = function(mailer, fn, context, ignoreLimits) {
    if(isBoolean(context)) {
      ignoreLimits = context
      context      = undefined
    }

    var sendMail = function(err) {
      if(err)
        return fn(null, err)

      this.forgotPassword.sentAt = Date.now()
      if(!ignoreLimits)
        this.forgotPassword.resendTries -= 1

      this.save(function(err) {
        if(err)
          return fn(null, err)

        mailer.forgotPassword(this.email, merge({
          link: config.url + '/forgot/' + this.forgotPassword.code,
          username: this.username
        }, context), function(err) {
          if(err)
            return fn(null, err)

          fn.apply(undefined, [null].concat(Array.prototype.slice.call(arguments)))
        })
      }.bind(this))
    }.bind(this)

    if(!this.forgotPassword.code) {
      this.forgotPassword = {
        code: uuid.v4(),
        resendTries: 6
      }
      this.save(sendMail)
    } else {
      if(!ignoreLimits) {
        if(this.forgotPassword.resendTries <= 0)
          return fn(config.forgotPassword.messages.resendThresholdDepleted)
        if(Date.now() - this.forgotPassword.sentAt <= config.forgotPassword.resendCooldown * 1e3)
          return fn(config.forgotPassword.messages.resendOnCooldown)
      }

      this.forgotPassword.code = uuid.v4()
      this.save(sendMail)
    }
  }
}