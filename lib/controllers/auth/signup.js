var each   = require('lodash-node/modern/collections/forEach')
var router = require('express').Router()
var User   = require('../../models/User')

/**
 * GET /signup
 * Create a new local account
 * @param username
 * @param password
 */
router.get('/', function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('auth/signup', {
    title: 'Registrieren',
    customJs: 'signup'
  })
})

/**
 * POST /signup
 * @param username
 * @param email
 * @param password
 */
router.post('/', function(req, res, next) {
  if(!req.app.config.flags.registration)
    return res.returnWith('error', 'Registrationen sind zur Zeit nicht erlaubt.')

  req.assert('username', 'Nutzername darf nicht leer sein').notEmpty()
  req.assert('email', 'E-Mail-Adresse darf nicht leer sein').notEmpty()
  req.assert('password', 'Passwort darf nicht leer sein').notEmpty()
  req.assert('confirmPassword', 'Passwörter stimmen nicht überein').equals(req.body.password)

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  var user = new User({
    username: req.body.username,
    email: req.body.email,
    teamspeak: req.body.teamspeak,
    password: req.body.password
  })

  user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    user.sendEmailVerification(req.app.mailer, function(msg, err, info) {
      if(err)
        return next(err)

      if(msg)
        req.flash('error', msg)
      else
        req.flash('success', req.app.config.emailVerification.messages.emailSent, { email: user.email })

      req.logIn(user, function(err) {
        if(err)
          return next(err)

        res.returnWith('success', '<strong>Hurra!</strong> Dein Account wurde erfolgreich erstellt.', req.session.returnTo || '/')
      })
    }, { isRegistration: true })
  })
})

/**
 * Export the router
 */
module.exports = router