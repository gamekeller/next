var router = require('express').Router()
var auth   = require('../../auth')

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
 * POST /account
 * Update account settings
 */
router.post('/', function(req, res, next) {
  var user = req.user
  var data = req.body

  var email = data.account.email != null
  var password = data.account.password != null

  if(email && data.account.email.trim() === user.email)
    return res.returnWith('error', 'E-Mail-Adresse wurde nicht verändert.')

  if(password) {
    req.assert('currentPassword', 'Aktuelles Passwort wird benötigt.').notEmpty()
    req.assert('account.password', 'Neues Passwort wird benötigt.').notEmpty()
    req.assert('confirmPassword', 'Passwörter stimmen nicht überein.').equals(data.account.password)

    if(!user.comparePasswordSync(data.currentPassword))
      return res.returnWith('error', 'Aktuelles Passwort ist falsch.')

    if(user.comparePasswordSync(data.account.password))
      return res.returnWith('error', 'Passwort wurde nicht verändert.')
  }

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  if(email)
    user.email = data.account.email

  if(password)
    user.password = data.account.password

  user.saveAndLogChanges(req.session, function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    if(email) {
      user.emailVerification = undefined
      user.emailVerified = false

      user.save(function(err) {
        if(err)
          return next(err)

        user.sendEmailVerification(req.app.mailer, function(msg, err, info) {
          if(err)
            return next(err)

          if(msg)
            res.returnWith('error', msg)
          else
            res.returnWith('success', req.app.config.emailVerification.messages.emailSent, { email: user.email })
        })
      })
    } else {
      res.returnWith('success', '<strong>Success!</strong> Your account settings were updated.')
    }
  })
})

/**
 * Mount child routers
 */
router.use('/verify/email', require('./verify/email'))
router.use('/delete', require('./delete'))
router.use('/security', require('./security'))
router.use('/teamspeak', require('./teamspeak'))

/**
 * Export the router
 */
module.exports = router