var path     = require('path')
var Promise  = require('bluebird')
var viewPath = require('gkmail').path

function prep(fn) {
  return function(to, context, callback) {
    callback = callback || function() {}

    fn.call(this, to, context, callback, function(subject) {
      return (context.username ? context.username + ' - ' : '') + subject
    })
  }
}

var Mailer = function(transport, render) {
  this.render            = render
  this.transport         = transport
  this.sendMail          = transport.sendMail.bind(transport)
  this.promisifiedRender = Promise.promisify(render)
}

Mailer.prototype.renderAll = function(name, context, callback) {
  return Promise.join(
    this.promisifiedRender(path.resolve(viewPath, name + '.html'), context),
    this.promisifiedRender(path.resolve(viewPath, name + '.txt'), context),
    function(html, txt) {
      callback(null, html, txt)
    }
  ).catch(callback)
}

Mailer.prototype.emailVerification = prep(function(to, context, fn, subject) {
  this.renderAll('emailVerification', context, function(err, html, txt) {
    if(err)
      return fn(err)

    this.sendMail({
     from: 'gamekeller.net Accounts <accounts@gamekeller.net>',
     to: to,
     subject: subject('gamekeller.net-Account E-Mail-Verifizierung'),
     html: html,
     text: txt
    }, fn)
  }.bind(this))
})

Mailer.prototype.forgotPassword = prep(function(to, context, fn, subject) {
  this.renderAll('forgotPassword', context, function(err, html, txt) {
    if(err)
      return fn(err)

    this.sendMail({
      from: 'gamekeller.net Accounts <accounts@gamekeller.net>',
      to: to,
      subject: subject('Zurücksetzen deines gamekeller.net-Account-Passworts'),
      html: html,
      text: txt
    }, fn)
  }.bind(this))
})

module.exports = Mailer