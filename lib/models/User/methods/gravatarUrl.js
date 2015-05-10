module.exports = function(userSchema) {
  userSchema.methods.gravatarUrl = function(size, defaults) {
    size     = size || 512
    defaults = defaults || 'retro'

    return '//0.gravatar.com/avatar/' + this.gravatarId + '?s=' + size + '&d=' + defaults + '&r=pg'
  }
}