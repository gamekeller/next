var Promise = require('bluebird')
var router  = require('express').Router()
var auth    = require('../../auth')

router.use(auth.ensureAuthenticated)

router.use(function(req, res, next) {
  res.locals.accountNav = [
    { href: '/account', name: 'Einstellungen', view: 'account/index' },
    { href: '/account/security', name: 'Sicherheit', view: 'account/security' }
  ]
  next()
})

/**
 * GET /account
 * Profile settings page
 */
router.get('/', function(req, res) {
  res.render('account/index', {
    title: 'Account',
    customJs: 'settings'
  })
})

/**
 * POST /account/email
 * Change email address
 */
router.post('/email', function(req, res, next) {
  var user = req.user

  req.assert('email', 'E-Mail-Adresse wird benötigt.').notEmpty()

  if(req.body.email.trim() === user.email)
    return res.returnWith('error', 'E-Mail-Adresse wurde nicht verändert.', '/account')

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array(), '/account')

    user.email = req.body.email

    user.saveAndLogChanges(req.session, function(err) {
      if(err)
        return res.handleMongooseError(err, next, '/account')

      user.emailVerification = undefined
      user.emailVerified = false

      user.save().then(function() {
        user.sendEmailVerification(req.app.mailer, function(msg, err) {
          if(err)
            return next(err)

          if(msg)
            res.returnWith('error', msg, '/account')
          else
            res.returnWith('success', req.app.config.emailVerification.messages.emailSent, { email: user.email }, '/account')
        })
      }).catch(next)
    })
  })
})

/**
 * POST /account/password
 * Change password
 */
router.post('/password', function(req, res, next) {
  var user = req.user

  req.assert('current', 'Aktuelles Passwort wird benötigt.').notEmpty()
  req.assert('new', 'Neues Passwort wird benötigt.').notEmpty()
  req.assert('confirm', 'Passwörter stimmen nicht überein.').equals(req.body.new)

  if(!user.comparePasswordSync(req.body.current))
    return res.returnWith('error', 'Aktuelles Passwort ist falsch.', '/account')

  if(user.comparePasswordSync(req.body.new))
    return res.returnWith('error', 'Passwort wurde nicht verändert.', '/account')

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array(), '/account')

    user.password = req.body.new

    user.destroySessions([req.session.id]).then(function() {
      user.saveAndLogChanges(req.session, function(err) {
        if(err)
          return res.handleMongooseError(err, next, '/account')

        res.returnWith('success', 'Dein Passwort wurde geändert.', '/account')
      })
    })
  })
})

/**
 * POST /account/hideRankNotice
 * Hide rank notice
 */
router.post('/hideRankNotice', function(req, res, next) {
  if(!req.user)
    return next()

  req.user.showRankNotice = false

  req.user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.redirect(req.session.returnTo)
  })
})

/**
 * Mount child routers
 */
router.use('/verify/email', require('./verify/email'))
router.use('/delete', require('./delete'))
router.use('/security', require('./security'))
router.use('/teamspeak', require('./teamspeak'))
router.use('/avatar', require('./avatar').router)
router.use('/rankup', require('./rankup'))

/**
 * Export the router
 */
module.exports = router