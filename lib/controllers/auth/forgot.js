var error  = require('../../error')
var router = require('express').Router()
var User   = require('../../models/User')

/**
 * GET /forgot
 * Forgot password page
 */
router.get('/', function(req, res) {
  res.render('auth/forgot', {
    title: 'Passwort vergessen'
  })
})

/**
 * POST /forgot
 * Forgot password
 */
router.post('/', function(req, res, next) {
  req.assert('email', 'E-Mail-Adresse darf nicht leer sein.').notEmpty()
  req.assert('email', 'E-Mail-Adresse muss gültig sein.').isEmail()

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array())

    var email = req.body.email.toLowerCase()

    User.findOne({ email: email }, function(err, user) {
      if(err)
        return next(err)
      if(!user)
        return res.returnWith('error', 'Keinen Account mit der E-Mail-Adresse "' + email + '" gefunden.')

      user.log('user.forgot_password', 'sentTo', req.session, { sentTo: email }, function(err, user) {
        if(err)
          return next(err)

        user.sendPasswordReset(req.app.mailer, function(msg, err) {
          if(err)
            return next(err)

          if(msg)
            res.returnWith('error', msg)
          else
            res.returnWith('success', req.app.config.forgotPassword.messages.emailSent, { email: user.email })
        })
      })
    })
  })
})

/**
 * Interpret reset code
 */
router.param('code', function(req, res, next, code) {
  User.findOne({ 'forgotPassword.code': code }, '+sessions', function(err, user) {
    if(err)
      return next(err)
    if(!user)
      return next(new error.NotFound)
    if(Date.now() - user.forgotPassword.sentAt > req.app.config.forgotPassword.tokenExpiration * 1e3)
      return res.returnWith('error', req.app.config.forgotPassword.messages.tokenExpired, '/forgot')

    req.profile = user
    next()
  })
})

/**
 * GET /forgot/:code
 * Reset password page
 */
router.get('/:code', function(req, res) {
  res.render('auth/reset', {
    title: 'Passwort zurücksetzen'
  })
})

/**
 * POST /forgot/:code
 * Reset password
 */
router.post('/:code', function(req, res, next) {
  var user = req.profile

  req.assert('password', 'Passwort darf nicht leer sein.').notEmpty()
  req.assert('confirmPassword', 'Passwörter stimmen nicht überein.').equals(req.body.password)

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array())

    user.password = req.body.password

    user.destroySessions(req.isAuthenticated() && user._id === req.user._id ? [req.session.id] : undefined)
    .then(function() {
      user.saveAndLogChanges(req.session, function(err) {
        if(err)
          return res.handleMongooseError(err, next)

        user.forgotPassword = undefined

        user.save(function(err) {
          if(err)
            return next(err)

          res.returnWith('success', req.app.config.forgotPassword.messages.successfulChange, { username: user.username }, '/login')
        })
      })
    })
  })
})

/**
 * Export the router
 */
module.exports = router