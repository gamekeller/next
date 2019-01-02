var Handle        = require('./')
var MongooseError = require('mongoose/lib/error')

function errorHandler(value, displayName, next) {
  return function(err) {
    if(err.name && err.name === 'ValidationError' && err.errors && err.errors.path) {
      err.errors.path.message = err.errors.path.message.replace(/^path/, displayName)
      return next(err)
    } else if(err.code !== 11000 && err.code !== 11001) {
      return next(err)
    }

    var valError = new MongooseError.ValidationError(err)
    valError.errors['handle'] = new MongooseError.ValidatorError({
      message: displayName + ' "{VALUE}" wird bereits verwendet.',
      value: value
    })

    next(valError)
  }
}

module.exports = function(schema, type, field, displayName) {
  // New doc
  schema.pre('save', function(next) {
    if(!this.isNew)
      return next()

    this.handle = new Handle({
      path: this[field].toLowerCase(),
      target: {
        id: this._id,
        type: type
      }
    })

    this.handle.save()
    .then(function() {
      next()
    })
    .catch(errorHandler(this[field], displayName, next))
  })

  // Updated doc
  schema.pre('save', function(next) {
    if(!this.isModified(field))
      return next()

    Handle.updateOne({ _id: this.handle }, { path: this[field].toLowerCase() }, { runValidators: true })
    .then(function() {
      next()
    })
    .catch(errorHandler(this[field], displayName, next))
  })

  // Removed doc
  schema.post('remove', function(doc, next) {
    if(!doc.handle)
      return next()

    Handle.deleteMany({ _id: doc.handle })
    .then(function() {
      next()
    })
    .catch(next)
  })
}