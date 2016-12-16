var Promise = require('bluebird')
var utils   = require('../../../utils')
var config  = require('../../../config')

module.exports = function(userSchema) {
  userSchema.methods.getRankValue = function() {
    return this.rank
  }

  userSchema.methods.getRankIcon = function() {
    return utils.getRankIcon(this.getRankValue())
  }

  userSchema.methods.getRankName = function() {
    return utils.getRankName(this.getRankValue())
  }

  userSchema.methods.getNextRank = function() {
    return utils.getNextRank(this.getRankValue())
  }

  userSchema.methods.isStaff = function() {
    return this.rank > 9000
  }

  userSchema.methods.getRankDisplayText = function() {
    return this.isStaff() || this.rank === 0 ? this.getRankName() : 'Level ' + this.level + ' ' + this.getRankName()
  }

  userSchema.methods.canRankUp = function() {
    if(!this.getNextRank()) return false

    var requirements = config.xp.nextRank[this.getNextRank()]

    if(!requirements) return false

    var sinceLast = requirements.lastPromotionHours * 60 * 60 * 1000

    return this.level >= requirements.levelNeeded && (Date.now() - this.xp.lastPromotionAt) >= sinceLast
  }

  userSchema.methods.rankUp = function() {
    if(!this.canRankUp()) return

    this.rank = this.getNextRank()
    this.level -= config.xp.nextRank[this.rank].levelNeeded - 1
    this.xp.lastPromotionAt = Date.now()
  }
}