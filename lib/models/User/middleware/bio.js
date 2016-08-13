var markdown = require('../../../markdown')

module.exports = function(userSchema) {
  userSchema.pre('save', function(next) {
    if(!this.isModified('bio.source'))
      return next()

    if(this.bio.source)
      this.bio.rendered = markdown.render(this.bio.source)
    else
      this.bio.rendered = undefined
    next()
  })
}