var each       = require('lodash-node/modern/collections/forEach')
var isFunction = require('lodash-node/modern/objects/isFunction')
var isObject   = require('lodash-node/modern/objects/isPlainObject')

module.exports = function(userSchema) {
  userSchema.methods.saveAndLogChanges = function(session, callback) {
    each(this.modifiedPaths(), function(path) {
      var log     = userSchema.path(path).options.log
      var hasConf = isObject(log)
      var logType = hasConf ? log.type : log
      var action  = hasConf && log.action ? log.action : 'user.change:' + path

      if(!logType)
        return

      var old   = this._clean.get(path)
      var fresh = this.get(path)

      if(isFunction(action))
        action = action(old, fresh)

      switch(logType) {
        case 'origin':
          this.log(action, session)
          break
        case 'change':
          this.log(action, logType, session, { old: '' + old, new: '' + fresh })
          break
        case 'teamspeakLink':
          var details = {}
          var isLink  = action.indexOf('unlink') === -1
          details['Eindeutige ID der ' + (isLink ? 'verknüpften' : 'entknüpften') + ' Teamspeak-Identität'] = isLink ? fresh : old
          this.log(action, logType, session, details)
          break
      }
    }, this)
    this.save(callback)
  }
}