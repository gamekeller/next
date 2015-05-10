var isString = require('lodash-node/modern/objects/isString')

module.exports = function(app) {
  app.response.returnWith = function(type, message, context, path) {
    if(isString(context)) {
      path = context
      context = undefined
    }

    this.req.flash(type, message, context)
    this.redirect(path || this.req.originalUrl)
  }
}