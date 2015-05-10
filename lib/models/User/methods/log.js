var Args = require('args-js')

module.exports = function(userSchema) {
  userSchema.methods.log = function() {
    var args = Args([
      { action:   Args.STRING   | Args.Required },
      { type:     Args.STRING   | Args.Optional, _default: 'origin', _check: function(val) { return /origin|change|sentTo|teamspeakLink/.test(val) } },
      { session:  Args.OBJECT   | Args.Required, _check: function(val) { return !!(val.id && val.ipAddress && val.userAgent) } },
      { details:  Args.OBJECT   | Args.Optional, _default: {} },
      { callback: Args.FUNCTION | Args.Optional }
    ], arguments)

    this.history.push({
      action: args.action,
      type: args.type,
      details: args.details,
      actor: {
        sessionId: args.session.id,
        ipAddress: args.session.ipAddress,
        userAgent: args.session.userAgent
      }
    })

    if(args.callback)
      this.save(args.callback)
  }
}