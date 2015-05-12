var _ = require('lodash')

module.exports = function(app) {
  app.response.returnWith = function(type, message, context, path) {
    if(_.isString(context)) {
      path = context
      context = undefined
    }

    this.req.flash(type, message, context)
    this.redirect(path || this.req.originalUrl)
  }
}