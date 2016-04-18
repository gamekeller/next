var _ = require('lodash')

module.exports = function(app) {
  app.response.returnWith = function(type, message, context, url) {
    if(_.isString(context)) {
      url = context
      context = undefined
    }

    this.req.flash(type, message, context)
    this.redirect(url || this.req.originalUrl)
  }
}