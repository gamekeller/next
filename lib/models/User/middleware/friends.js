module.exports = function(userSchema) {
  userSchema.post('remove', function(doc) {
    doc.constructor.update({}, { $pull: { friends: this.id } }, { multi: true }).exec()
  })
}