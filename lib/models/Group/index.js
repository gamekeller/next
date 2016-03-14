var mongoose = require('mongoose')
var config   = require('../../config')
var utils    = require('../../utils')

/**
 * Create the schema
 */
var groupSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minlength: [3, 'Name muss mindestens drei Zeichen lang sein.'],
    maxlength: [80, 'Name darf nicht länger als 80 Zeichen sein.'],
    validate: [
      {
        msg: 'Name muss mindestens ein alphanumerisches Zeichen enthalten.',
        validator: utils.buildSchemaValidator('name', function(name) {
          return validator.matches(name, /[A-Za-z0-9]/)
        })
      },
    ]
  },
  vanity: {
    type: String,
    trim: true,
    maxlength: [24, 'Benutzerdefinierte URL darf nicht länger als 24 Zeichen sein.']
  },
  owner: {
    type: String,
    ref: 'User'
  },
  members: [{
    type: String,
    ref: 'User'
  }]
})

/**
 * Add handle middleware
 */
require('../Handle/middleware')(groupSchema, 'group', 'vanity', 'Benutzerdefinierte URL')

/**
 * Export the schema
 */
module.exports = mongoose.model('Group', groupSchema)