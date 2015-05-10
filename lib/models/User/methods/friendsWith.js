module.exports = function(userSchema) {
  userSchema.methods.friendsWith = function(id) {
    return this.friends.indexOf(id) !== -1
  }
}