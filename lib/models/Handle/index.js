var mongoose  = require('mongoose')
var utils     = require('../../utils')
var config    = require('../../config')
var validator = require('validator')

/**
 * Create the schema
 */
var handleSchema = new mongoose.Schema({
  path: {
    type: String,
    lowercase: true,
    unique: true,
    minlength: [3, '{PATH} muss mindestens drei Zeichen lang sein.'],
    validate: [
      utils.buildSchemaValidator(
        'username',
        '{PATH} darf kein reserviertes Wort sein.',
        function(name) {
          return !validator.isIn(name, config.blacklist.vanity)
        }
      ),
      utils.buildSchemaValidator(
        'username',
        '{PATH} darf nur große und kleine Buchstaben, Zahlen, Unterstriche und Minuszeichen enthalten [A-Za-z0-9_-].',
        function(name) {
          return validator.matches(name, /^[\w-]+$/)
        }
      ),
      utils.buildSchemaValidator(
        'username',
        '{PATH} muss mindestens ein alphanumerisches Zeichen enthalten.',
        function(name) {
          return validator.matches(name, /[A-Za-z0-9]/)
        }
      )
    ]
  },
  target: {
    id: {
      type: mongoose.Schema.Types.ObjectId
    },
    type: {
      type: String,
      enum: ['group', 'user']
    }
  }
})

/**
 * Export the schema
 */
module.exports = mongoose.model('Handle', handleSchema)