var utils = require('../utils')

module.exports = function(app) {
  app.response.resolveUrl = app.request.resolveUrl = function(target) {
    return utils.resolveUrl(this.originalUrl || this.req.originalUrl, target)
  }
}