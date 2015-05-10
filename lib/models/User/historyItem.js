var mongoose = require('mongoose')
var platform = require('platform')

/**
 * Create the schema
 */
var historyItemSchema = new mongoose.Schema({
  action: String,
  type: String,
  details: Object,
  createdAt: { type: Number, default: Date.now },
  actor: {
    sessionId: String,
    ipAddress: String,
    userAgent: String
  }
})

historyItemSchema.virtual('actor.platform').get(function() {
  if(!this.actor || !this.actor.userAgent)
    return undefined

  return platform.parse(this.actor.userAgent)
})

historyItemSchema.virtual('description').get(function() {
  switch(this.type) {
    case 'origin':
      return 'Ausgegangen von ' + this.actor.ipAddress
    case 'change':
      return this.details.old + ' geändert in ' + this.details.new
    case 'sentTo':
      return 'Gesendet an ' + this.details.sentTo
    case 'teamspeakLink':
      if(this.action.indexOf('unlink') === -1)
        return 'Neue Teamspeak-Verknüpfung hergestellt.'
      else
        return 'Teamspeak-Verknüpfung aufgehoben.'
  }
})

/**
 * Export the schema
 */
module.exports = historyItemSchema