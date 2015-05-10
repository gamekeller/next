module.exports = function(app) {
  var render = app.response.render
  app.response.render = function(name) {
    this.activeView = this.locals.activeView = name
    render.apply(this, arguments)
  }
}