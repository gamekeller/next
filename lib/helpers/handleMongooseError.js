var each            = require('lodash-node/modern/collections/forEach')
var ValidationError = require('mongoose/lib/error/validation')

module.exports = function(app) {
  app.response.handleMongooseError = function(err, next) {
    if(!(err instanceof ValidationError))
      return next(err)

    var errors = []

    if(err.errors) {
      each(err.errors, function(error, field) {
        errors.push({ msg: error.message })
      })
    }

    return this.returnWith('error', errors)
  }
}