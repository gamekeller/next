var path     = require('path')
var Promise  = require('bluebird')
var config   = require('./config')
var mailgun  = require('mailgun-js')(config.mail.mailgun)
var viewPath = require('gkmail').path

var Mailer = function(render) {
  this._render = Promise.promisify(render)
}

Mailer.prototype.render = function(name, context) {
  return Promise.props({
    html: this._render(path.resolve(viewPath, name + '.html'), context),
    text: this._render(path.resolve(viewPath, name + '.txt'), context)
  })
}

Mailer.prototype.send = function(options, context) {
  if(!options.template || !options.to || !options.from || !options.subject) {
    return Promise.reject(new Error('Missing options. template|from|to|subject required.'))
  }

  return this.render(options.template, context)
  .then(function(renders) {
    if (config.mail.mailgun.testMode) console.log(renders.text || renders.html)
    return mailgun.messages().send({
      from: options.from,
      subject: options.subject,
      to: options.to,
      html: renders.html,
      text: renders.text
    })
  })
}

module.exports = Mailer