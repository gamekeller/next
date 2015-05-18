/**
 * Dependencies
 */
var _              = require('lodash')
var bodyParser     = require('body-parser')
var compress       = require('compression')
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
var nodemailer     = require('nodemailer')
var passport       = require('passport')
var redis          = require('./lib/redis')
var session        = require('express-session')
var utils          = require('./lib/utils')
var validator      = require('express-validator')
var yodel          = require('./lib/yodel')
var RedisStore     = require('connect-redis')(session)

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
var config = app.config = require('./lib/config')
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
mongoose.connect(config.secrets.db)
mongoose.connection.on('connected', function() {
  console.log('✔ MongoDB connection established.')
})
mongoose.connection.on('error', function() {
  console.error('✗ Unable to connect to MongoDB.')
})

/**
 * TeamSpeak RPC config
 */
yodel.connect(config.teamspeak.yodel)
yodel.on('connect', function() {
  console.log('✔ TeamSpeak RPC connection established.')
})
yodel.on('end', function() {
  console.error('✗ TeamSpeak RPC connection lost.')
})
yodel.on('error', function(err) {
  if(err.code === 'ECONNREFUSED')
    console.error('✗ Unable to connect to TeamSpeak RPC server.')
  else
    console.error('✗ TeamSpeak RPC error:', err)
})


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
app.use(bodyParser.json({ type: 'application/csp-report' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(validator())
app.use(methodOverride())
app.use('/api', require('./lib/controllers/api'))
app.use(session({
  name: 'sid',
  resave: true,
  saveUninitialized: true,
  secret: config.secrets.session,
  genid: function() { return '' + new mongoose.Types.ObjectId },
  store: new RedisStore({
    client: redis.$
  })
}))
app.use(csp({
  defaultSrc: ["'self'", 'serve.gamekeller.net'],
  scriptSrc: ["'self'", "'unsafe-inline'", 'www.google-analytics.com', config.assetHost],
  styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', config.assetHost],
  imgSrc: ["'self'", '0.gravatar.com', 'camo.gamekeller.net', 'www.google-analytics.com', config.assetHost],
  fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com', config.assetHost],
  connectSrc: ["'self'", 'www.reddit.com'],
  sandbox: ['allow-forms', 'allow-same-origin', 'allow-scripts'],
  reportUri: '/report-csp-violation'
}))
app.post('/report-csp-violation', function(req, res) {
  if(req.headers['content-type'] !== 'application/csp-report')
    return res.status(400).end()

  console.error('CSP Violation:', JSON.stringify(req.body, null, 2))
  res.status(200).end()
})
app.use(csrf())

// Mailer
// --------------------------------
var Mailer = require('./lib/mailer')
app.mailer = new Mailer(nodemailer.createTransport(config.mail), app.render.bind(app))

// Passport
// --------------------------------
app.use(passport.initialize())
app.use(passport.session())
require('./lib/helpers/auth')(app)

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

  sess.save(next)
})

// Locals
// --------------------------------
app.use(function(req, res, next) {
  var user = req.user

  _.assign(res.locals, {
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

  if(user) {
    nav.main.push(
      { href: '/members', name: 'Mitglieder', view: 'members' }
    )

    if(user.admin)
      nav.main.push({ href: '/admin', name: 'Administration', view: /^admin/ })

    nav.right.push(
      { href: '/' + user.username, content: '<img class="mini-avatar" src="' + user.gravatarUrl(40) + '"> ' + user.username },
      { href: '/account', content: '<span class="icon icon-gear"></span>', title: 'Einstellungen' },
      { href: '/logout', form: true, content: '<button type="submit" class="btn btn-link" title="Ausloggen"><span class="icon icon-logout"></span></button>' }
    )
  } else
    nav.right.push(
      { href: '/login', name: 'Login' },
      { href: '/signup', name: 'Registrieren' }
    )

  // Return path
  var route = req.path.split('/')[1]

  if(req.method === 'POST' || /login|logout|signup|session/i.test(route) || app.get('env') === 'development' && /apple-touch-icon|browserconfig|favicon|mstile|robots|assets/.test(route))
    return next()

  req.session.returnTo = req.path

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
app.use(require('./lib/controllers/profile'))

// 404
app.use(function(req, res, next) {
  return next(new error.NotFound)
})

// Error handler
// --------------------------------
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

  var isApi = req.url.indexOf('/api') === 0

  res.status(err.status)

  if(req.accepts('html') && !isApi)
    res.type('html').send(err.toHTMLString())
  else if(req.accepts('json'))
    res.json(err)
  else
    res.type('txt').send(err.toString())
})

/**
 * Start the server
 */
if(!module.parent)
  app.listen(app.get('port'), function() {
    console.log('✔ Express server listening on port %d in %s mode.', app.get('port'), app.get('env'))
  })