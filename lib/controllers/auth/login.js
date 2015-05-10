var router   = require('express').Router()
var passport = require('passport')

/**
 * GET /login
 * Login page
 */
router.get('/', function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('auth/login', {
    title: 'Login'
  })
})

/**
 * POST /login
 * Sign in using username and password
 * @param username
 * @param password
 */
router.post('/', function(req, res, next) {
  if(!req.app.config.flags.login)
    return res.returnWith('error', 'Login ist zur Zeit nicht erlaubt.')

  req.assert('username', 'Nutzername ist nicht gültig').matches(/^[\w-]+$/).len(1, 16)
  req.assert('password', 'Passwort darf nicht leer sein').notEmpty()

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  passport.authenticate('local', function(err, user, info) {
    if(err)
      return next(err)

    if(!user)
      return res.returnWith('error', info.message)

    if(info && info.error === 'wrongPassword')
      user.log('user.login_failed', req.session, function(err) {
        if(err)
          return next(err)

        res.returnWith('error', info.message)
      })
    else
      req.logIn(user, function(err) {
        if(err)
          return next(err)

        res.returnWith('success', '<strong>Hurra!</strong> Du bist nun eingeloggt.', req.session.returnTo || '/')
      })
  })(req, res, next)
})

/**
 * Export the router
 */
module.exports = router