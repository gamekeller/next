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

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  User.findOne({ email: req.body.email }, function(err, user) {
    if(err)
      return next(err)
    if(!user)
      return res.returnWith('error', 'Keinen Account mit der E-Mail-Adresse "' + req.body.email + '" gefunden.')

    user.log('user.forgot_password', 'sentTo', req.session, { sentTo: req.body.email }, function(err, user) {
      if(err)
        return next(err)

      user.sendPasswordReset(req.app.mailer, function(msg, err, info) {
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

/**
 * Interpret reset code
 */
router.param('code', function(req, res, next, code) {
  User.findOne({ 'forgotPassword.code': code }, function(err, user) {
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

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  user.password = req.body.password

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

/**
 * Export the router
 */
module.exports = router