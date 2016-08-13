var mongoose  = require('mongoose')
var validator = require('validator')
var config    = require('../../config')
var utils     = require('../../utils')
var markdown  = require('../../markdown')
var Post      = require('./index')
var slugify   = require('speakingurl')

/**
 * Create the schema
 */
var supportArticleSchema = new mongoose.Schema({
  category: {
    type: String,
    trim: true
  },
  categorySlug: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  showcase: {
    active: Boolean,
    title: {
      type: String,
      trim: true
    },
    guide: Boolean
  }
})

/**
 * Category slug middleware
 */
supportArticleSchema.pre('save', function(next) {
  if(this.category && !this.isModified('category'))
    return next()

  if(this.category)
    this.categorySlug = slugify(this.category)
  else
    this.categorySlug = undefined

  next()
})

/**
 * Render static
 */
supportArticleSchema.static('render', function(text) {
  return markdown.renderWithAnchoredHeadings(text)
})

/**
 * Export the schema
 */
module.exports = Post.discriminator('SupportArticle', supportArticleSchema)