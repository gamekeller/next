/**
 * Dependencies
 */
var express        = require('express')
var st             = require('st')
var flash          = require('express-flash')
var path           = require('path')
var mongoose       = require('mongoose')
var passport       = require('passport')
var validator      = require('express-validator')
var bodyParser     = require('body-parser')
var compress       = require('compression')
var favicon        = require('static-favicon')
var logger         = require('morgan')
var cookieParser   = require('cookie-parser')
var methodOverride = require('method-override')
var session        = require('express-session')
var csrf           = require('csurf')
var errorHandler   = require('errorhandler')
var MongoStore     = require('connect-mongo')(session)

/**
 * Load controllers
 */
var homeController    = require('./controllers/home')
var accountController = require('./controllers/account')
var profileController = require('./controllers/profile')
var adminController   = require('./controllers/admin')

/**
 * Configuration
 */
var secrets = require('./config/secrets')
var pass    = require('./config/passport')
var mincer  = require('./config/mincer')

/**
 * Create Express server
 */
var app = express()

/**
 * Mongoose config
 */
mongoose.connect(secrets.db, secrets.dbOptions)
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.')
})

/**
 * Render override
 */
var render = app.response.render

app.response.render = function() {
  this.locals.view = arguments[0].split('/').slice(-1)
  render.apply(this, arguments)
}

/**
 * Express configuration
 */
var env = process.env.NODE_ENV || 'development'

// General setup
// --------------------------------
app.set('port', process.env.PORT || 3000)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(mincer.assets())
app.use(compress())
app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(logger('dev'))
app.use(cookieParser())
app.use(bodyParser())
app.use(validator())
app.use(methodOverride())
app.use(session({
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  }, function() { console.log('✔ Session store connection established') })
}))
app.use(csrf())

// Passport
// --------------------------------
app.use(passport.initialize())
app.use(passport.session())

// Locals
// --------------------------------
app.use(function(req, res, next) {
  var user = res.locals.user = req.user
  res.locals.token = req.csrfToken()

  // Navigation items
  var nav = res.locals.nav = {
    main: [],
    right: []
  }

  if(user) {
    if(user.admin)
      nav.main.push({ href: '/admin', name: 'Admin Page' })

    nav.right.push({
      dropdown: true,
      content: '<img class="avatar" src="' + user.gravatar(60) + '"> ' + user.username,
      items: [
        { href: '/account', name: 'Account' },
        { href: '/@' + user.username, name: 'Profile' },
        { divider: true },
        { href: '/logout', name: 'Log Out' }
      ]
    })
  } else
    nav.right.push(
      { href: '/login?returnTo=' + req.path, name: 'Login' },
      { href: '/signup?returnTo=' + req.path, name: 'Sign Up' }
    )

  return next()
})

// Flash messages
// --------------------------------
app.use(flash())

// Asset configuration
// --------------------------------
if(env === 'production')
  app.use(st({
    path: path.join(__dirname, 'public/assets'),
    url: '/assets'
  }))
else
  app.use('/assets', mincer.createServer())

/**
 * Routes
 */
app.use(homeController)
app.use(accountController)
app.use(profileController)
app.use(adminController)

// 404
// --------------------------------
app.use(function(req, res) {
  res.status(404)
  res.render('404')
})

// Last stop: default error handler
// --------------------------------
app.use(errorHandler())

/**
 * Start the server
 */
app.listen(app.get('port'), function() {
  console.log('✔ Express server listening on port %d in %s mode', app.get('port'), env)
})