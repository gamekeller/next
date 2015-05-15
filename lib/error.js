var errorPages = require('gamekeller-error-pages')
var template   = require('lodash/string/template')
var inherit    = require('soak').inherit
var http       = require('http')

var HTTPError = exports.HTTPError = inherit(Error, {
  constructor: function HTTPError(status, message) {
    Error.call(this, message)

    // Remove the Error itself from the stack trace.
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    Error.captureStackTrace(this, this.constructor)

    this.name    = http.STATUS_CODES[status] || this.constructor.name
    this.status  = status
    this.message = message || http.STATUS_CODES[status] || ''
  },

  toString: function() {
    return this.status + ' ' + this.name + (this.message !== this.name ? ': ' + this.message : '')
  },

  toHTMLString: function() {
    return template(errorPages.template)({
      title: (errorPages.content[this.status] && errorPages.content[this.status].title) || this.name,
      body: this.message !== http.STATUS_CODES[this.status] ? this.message : errorPages.content[this.status] ? errorPages.content[this.status].body : this.message,
      code: this.status
    })
  }
}, { extend: inherit.constructor().extend })

exports.BadRequest = HTTPError.extend({
  constructor: function BadRequest(message) {
    HTTPError.call(this, 400, message)
  }
})

exports.Unauthorized = HTTPError.extend({
  constructor: function Unauthorized(message) {
    HTTPError.call(this, 401, message)
  }
})

exports.Forbidden = HTTPError.extend({
  constructor: function Forbidden(message) {
    HTTPError.call(this, 403, message)
  }
})

exports.NotFound = HTTPError.extend({
  constructor: function NotFound(message) {
    HTTPError.call(this, 404, message)
  }
})

exports.MethodNotAllowed = HTTPError.extend({
  constructor: function MethodNotAllowed(message) {
    HTTPError.call(this, 405, message)
  }
})

exports.RequestEntityTooLarge = HTTPError.extend({
  constructor: function RequestEntityTooLarge(message) {
    HTTPError.call(this, 413, message)
  }
})