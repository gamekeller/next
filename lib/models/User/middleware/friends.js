module.exports = function(userSchema) {
  userSchema.post('remove', function(doc) {
    doc.constructor.updateMany({}, { $pull: { friends: this.id } }).exec()
  })
}