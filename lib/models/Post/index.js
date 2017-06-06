var mongoose    = require('mongoose')
var validator   = require('validator')
var mergePlugin = require('mongoose-merge-plugin')
var config      = require('../../config')
var utils       = require('../../utils')
var markdown    = require('../../markdown')


/**
 * Create the schema
 */
var postSchema = new mongoose.Schema({
  slug: {
    type: String,
    trim: true,
    unique: true,
    required: 'URL wird benötigt.',
    maxlength: [200, 'URL darf nicht länger als 200 Zeichen sein.'],
    validate: [
      utils.buildSchemaValidator(
        'slug',
        'URL muss mindestens ein alphanumerisches Zeichen enthalten.',
        function(url) {
          return validator.matches(url, /[A-Za-z0-9]/)
        }
      )
    ]
  },
  title: {
    type: String,
    required: 'Titel wird benötigt.',
    minlength: [1, 'Titel muss mindestens ein Zeichen lang sein.'],
    maxlength: [500, 'Titel darf nicht länger als 500 Zeichen sein.'],
    validate: [
      utils.buildSchemaValidator(
        'title',
        'Titel muss mindestens ein alphanumerisches Zeichen enthalten.',
        function(title) {
          return validator.matches(title, /[A-Za-z0-9]/)
        }
      )
    ]
  },
  text: {
    source: {
      type: String,
      required: 'Text wird benötigt.',
      maxlength: [50000, 'Text dark nicht länger als 50000 Zeichen sein.'],
      validate: [
        utils.buildSchemaValidator(
          'text.source',
          'Text darf nicht nur aus Leerzeichen bestehen.',
          function(text) {
            if(!text)
              return true

            return validator.matches(text, /\S/)
          }
        )
      ]
    },
    rendered: { type: String, mergeable: false }
  }
}, { timestamps: true })

/**
 * Render static
 */
postSchema.static('render', function(text) {
  return markdown.render(text)
})

/**
 * Text middleware
 */
postSchema.pre('save', function(next) {
  if(!this.isModified('text.source'))
    return next()

  if(this.text.source)
    this.text.rendered = this.schema.statics.render(this.text.source)
  else
    this.text.rendered = undefined

  next()
})

/**
 * Plug in mergePlugin
 */
postSchema.plugin(mergePlugin)

/**
 * Export the schema
 */
module.exports = mongoose.model('Post', postSchema)