/**
 * Dependencies
 */
var _              = require('lodash')
var avatar         = require('./lib/controllers/account/avatar')
var bodyParser     = require('body-parser')
var compress       = require('compression')
var config         = require('./lib/config')
var cookieParser   = require('cookie-parser')
var csp            = require('helmet-csp')
var csrf           = require('csurf')
var error          = require('./lib/error')
var errorHandler   = require('errorhandler')()
var express        = require('express')
var favicon        = require('serve-favicon')
var hbs            = require('hbs').__express
var logger         = require('morgan')
var methodOverride = require('method-override')
var moment         = require('moment')
var mongoose       = require('mongoose')
var passport       = require('passport')
var redis          = require('./lib/redis')
var session        = require('express-session')
var utils          = require('./lib/utils')
var uuid           = require('uuid')
var validator      = require('express-validator')
var RedisStore     = require('connect-redis')(session)

if(config.opbeat.active) {
  var opbeat = require('opbeat').start(config.opbeat.credentials)
}

/**
 * Create Express server
 */
var app = module.exports = express()

require('./lib/helpers/flash')(app)
require('./lib/helpers/returnWith')(app)
require('./lib/helpers/handleMongooseError')(app)
require('./lib/helpers/resolveUrl')(app)
require('./lib/helpers/render')(app)

/**
 * Configuration
 */
app.config = config
var mincer = require('./lib/mincer')

/**
 * Redis
 */
redis.$.on('connect', function() {
  console.log('✔ Redis connection established.')
})
redis.$.on('error', function() {
  console.error('✗ Unable to connect to Redis.')
})

/**
 * Mongoose config
 */
require('./lib/mongo')

/**
 * moment
 */
moment.locale('de')
app.moment = moment

/**
 * Express configuration
 */

// General setup
// --------------------------------
if(app.get('env') === 'production')
  app.enable('trust proxy')
if(app.get('env') === 'development')
  app.locals.pretty = true
app.disable('x-powered-by')
app.set('port', _.parseInt(config.port) + (_.parseInt(process.env.NODE_APP_INSTANCE) || 0))
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.engine('html', hbs)
app.engine('txt', hbs)
app.use(mincer.assets())
app.use(compress())
app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(logger(process.env.LOGFORMAT || 'dev', {
  skip: function(req) { return /apple-touch-icon|browserconfig|favicon|mstile|robots|assets/.test(req.originalUrl.split('/')[1]) }
}))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(validator())
app.use(methodOverride())
app.use('/api', require('./lib/controllers/api'))

// Session
// --------------------------------
app.use(session({
  name: 'sid',
  resave: false,
  saveUninitialized: true,
  secret: config.secrets.session,
  genid: function() { return '' + new mongoose.Types.ObjectId },
  store: new RedisStore({
    client: redis.$,
    prefix: redis.prefix + 'sess:'
  })
}))

// CSP
// --------------------------------
app.use(function(req, res, next) {
  res.locals.nonce = uuid.v4()
  next()
})
function acceptNonce(req, res) {
  return "'nonce-" + res.locals.nonce + "'"
}
app.use(csp({
  directives: {
    defaultSrc: ["'self'", 'https://serve.gamekeller.net', 'https://' + config.assetHost],
    scriptSrc: ["'self'", 'https://www.google-analytics.com', 'https://api.tumblr.com', 'https://' + config.assetHost, acceptNonce, "'unsafe-inline'"],
    styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://' + config.assetHost, acceptNonce, "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https://0.gravatar.com', 'https://camo.gamekeller.net', 'https://www.google-analytics.com', 'https://' + config.assetHost, 'https://' + config.userContentHost],
    fontSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://' + config.assetHost],
    connectSrc: ["'self'", 'https://www.reddit.com'],
    formAction: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    reportUri: config.cspReportUri
  },
  browserSniff: false
}))

// Passport
// --------------------------------
app.use(passport.initialize())
app.use(passport.session())
require('./lib/helpers/auth')(app)

// CSRF
// --------------------------------
avatar.upload(app)
app.use(csrf())

// Mailer
// --------------------------------
var Mailer = require('./lib/mailer')
app.mailer = new Mailer(_.bind(app.render, app))

// Asset configuration
// --------------------------------
if(app.get('env') === 'development')
  app.use('/assets', mincer.createServer())

if(app.get('env') === 'development' || process.env.SIMULATE_PRODUCTION)
  app.use(express.static(__dirname + '/public'))

// Session updates
// --------------------------------
app.use(function(req, res, next) {
  var now  = Date.now()
  var sess = req.session

  sess.userAgent = req.headers['user-agent']
  sess.ipAddress = req.ip
  sess.usedAt    = now

  if(!sess.createdAt)
    sess.createdAt = now

  if(req.isAuthenticated() && req.session.remember)
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000

  sess.save(next)
})

// Locals
// --------------------------------
app.use(function(req, res, next) {
  var user = req.user

  _.assign(res.locals, {
    _: _,
    req: req,
    config: config,
    user: user,
    moment: moment,
    url: req.resolveUrl.bind(req),
    utils: utils
  })

  utils.navItemIsActive = function(item) {
    return item.active || (_.isRegExp(item.view) && item.view.test(res.activeView)) || item.view === res.activeView
  }

  // Navigation items
  var nav = res.locals.nav = {
    main: [],
    right: []
  }

  // Logged-in
  if(user) {
    nav.main.push(
      // { href: '/groups', name: 'Gruppen', view: /^groups/ },
      { href: '/support', name: 'Support', view: /^support/ },
      { href: '/members', name: 'Mitglieder', view: 'members' }
    )

    // Admin
    if(user.admin) {
      nav.main.push({
        content: 'Administration',
        view: /^admin/,
        dropdown: true,
        items: [
          { href: '/admin/user', name: 'User' },
          { href: '/admin/kb', name: 'Knowledgebase' }
        ]
      })
    }

    nav.right.push(
      { href: '/' + user.username, content: utils.avatarElement(user, 40, 'mini-avatar') + ' ' + user.username },
      { href: '/account', content: '<span class="icon icon-gear"></span>', title: 'Einstellungen' },
      { href: '/logout', form: true, content: '<button type="submit" class="btn btn-link" title="Ausloggen"><span class="icon icon-logout"></span></button>' }
    )
  } else { // Not logged-in
    nav.right.push(
      { href: '/login', name: 'Login' },
      { href: '/signup', name: 'Registrieren' }
    )
  }

  // Return path
  var route = req.path.split('/')[1]

  if(req.method === 'POST' || /login|logout|signup|session|forgot/i.test(route) || app.get('env') === 'development' && /apple-touch-icon|browserconfig|favicon|mstile|robots|assets/.test(route))
    return next()

  req.session.returnTo = req.originalUrl

  next()
})

/**
 * Routes
 */
app.use(require('./lib/controllers/common'))

// Authentication
app.use('/signup', require('./lib/controllers/auth/signup'))
app.use('/login', require('./lib/controllers/auth/login'))
app.use('/logout', require('./lib/controllers/auth/logout'))
app.use('/forgot', require('./lib/controllers/auth/forgot'))

app.use('/account', require('./lib/controllers/account'))
app.use('/session', require('./lib/controllers/session'))
app.use('/admin', require('./lib/controllers/admin'))
app.use('/support', require('./lib/controllers/support'))
// app.use('/groups', require('./lib/controllers/group/overview'))
app.use(require('./lib/controllers/handle'))

// Error handling
// --------------------------------
function outputError(err, req, res) {
  var isApi = req.url.indexOf('/api') === 0

  res.status(err.status)

  if(req.accepts('html') && !isApi)
    res.type('html').send(err.toHTMLString(res.locals.nonce))
  else if(req.accepts('json'))
    res.json(err)
  else
    res.type('txt').send(err.toString())
}

// Not found
app.use(function(req, res) {
  outputError(new error.NotFound(), req, res)
})

// Opbeat
if(config.opbeat.active)
  app.use(opbeat.middleware.express())

// Final error handler
app.use(function(err, req, res, next) {
  if(err.code === 'EBADCSRFTOKEN')
    err = new error.Forbidden('Invalid CSRF token')

  if(!(err instanceof error.HTTPError))
    if(app.get('env') === 'production') {
      console.error(err.stack)
      err = new error.HTTPError(500)
    } else {
      return errorHandler.apply(null, Array.prototype.slice.call(arguments))
    }

  outputError(err, req, res)
})

/**
 * Start the server
 */
if(!module.parent)
  app.listen(app.get('port'), function() {
    console.log('✔ Express server listening on port %d in %s mode.', app.get('port'), app.get('env'))
  })