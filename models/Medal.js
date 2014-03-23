var mongoose = require('mongoose')

var medalSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  desc: { type: String, required: true }
})

/**
 * Export medal model
 */
module.exports = mongoose.model('Medal', medalSchema)