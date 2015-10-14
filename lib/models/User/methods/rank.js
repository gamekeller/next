var config = require('../../../config')

module.exports = function(userSchema) {
  userSchema.methods.getRankValue = function() {
    return this.teamspeakRank ? config.teamspeak.rankValues[this.teamspeakRank] : 0
  }

  userSchema.methods.getRankIcon = function () {
    return this.teamspeakRank ? 'img/ranks/' + this.teamspeakRank.toLowerCase() + '.png' : ''
  }
}