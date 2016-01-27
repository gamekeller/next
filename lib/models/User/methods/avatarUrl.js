var config = require('../../../config')

module.exports = function(userSchema) {
  userSchema.methods.avatarUrl = function(size) {
    switch(this.avatar.type) {
      case 'gravatar':
        return 'https://0.gravatar.com/avatar/' + this.avatar.id + '?s=' + (size || 512) + '&d=retro&r=pg'
        break
      case 'upload':
      case 'default':
        return 'https://' + config.userContentHost + '/' + config.avatarsPath + '/' + (this.avatar.type === 'default' ? this.avatar.defaultId : this.avatar.id)
        break
      default:
        console.error('Unknown avatar type: ' + this.avatar.type)
        return ''
        break
    }
  }
}