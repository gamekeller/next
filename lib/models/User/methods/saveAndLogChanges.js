var Promise = require('bluebird')
var _ = require('lodash')

module.exports = function(userSchema) {
  userSchema.methods.saveAndLogChanges = function(session, callback) {
    var promises = _.map(this.modifiedPaths(), _.bind(function(path) {
      var log     = userSchema.path(path).options.log
      var hasConf = _.isPlainObject(log)
      var logType = hasConf ? log.type : log
      var action  = hasConf && log.action ? log.action : 'user.change:' + path

      if(!logType)
        return null

      var old     = this._clean.get(path)
      var fresh   = this.get(path)
      var promise = null

      if(_.isFunction(action))
        action = action(old, fresh)

      switch(logType) {
        case 'origin':
          promise = this.log(action, session)
          break
        case 'change':
          promise = this.log(action, logType, session, { old: '' + old, new: '' + fresh })
          break
        case 'teamspeakLink':
          var details = {}
          var isLink  = action.indexOf('unlink') === -1
          details['Eindeutige ID der ' + (isLink ? 'verknüpften' : 'entknüpften') + ' Teamspeak-Identität'] = isLink ? fresh : old
          promise = this.log(action, logType, session, details)
          break
      }

      return promise
    }, this))

    Promise.all(promises)
    .then(function() {
      this.save(callback)
    }.bind(this))
  }
}