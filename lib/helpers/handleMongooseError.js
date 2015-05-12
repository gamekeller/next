var _               = require('lodash')
var ValidationError = require('mongoose/lib/error/validation')

module.exports = function(app) {
  app.response.handleMongooseError = function(err, next) {
    if(!(err instanceof ValidationError))
      return next(err)

    var errors = []

    if(err.errors) {
      _.each(err.errors, function(error, field) {
        errors.push({ msg: error.message })
      })
    }

    return this.returnWith('error', errors)
  }
}