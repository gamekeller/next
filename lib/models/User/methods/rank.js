var _ = require('lodash')
var config = require('../../../config')
var lowercaseRanks = _.mapValues(config.ranks, _.toLower)

module.exports = function(userSchema) {
  userSchema.methods.getRankValue = function() {
    return this.rank
  }

  userSchema.methods.getRankIcon = function() {
    return this.rank ? 'img/ranks/' + lowercaseRanks[this.rank] + '.png' : null
  }

  userSchema.methods.getRankName = function() {
    return config.ranks[this.rank]
  }
}