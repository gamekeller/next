var _ = require('lodash')

function flash(type, msg, context) {
  var messages = this.session.flash = this.session.flash || {}

  if(type && msg) {
    messages[type] = messages[type] || []

    if(!_.isArray(msg))
      msg = [msg]

    _.each(msg, function(message) {
      if(message && message.msg)
        message = message.msg

      messages[type].push({ msg: context ? _.template(message)(context) : message })
    })

    return messages[type].length
  } else if(type) {
    var arr = messages[type]

    delete messages[type]

    return arr || []
  } else {
    this.session.flash = {}

    return messages
  }
}

module.exports = function(app) {
  app.request.flash = flash

  var render = app.response.render
  app.response.render = function() {
    var flash = this.locals.flash = this.req.flash()
    flash.hasMessages = flash.error || flash.info || flash.success
    render.apply(this, arguments)
  }
}