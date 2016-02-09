var error  = require('../../../error')
var router = require('express').Router()
var User   = require('../../../models/User')

/**
 * Interpret verification code
 */
router.param('code', function(req, res, next, code) {
  User.findOne({ 'emailVerification.code': code }, function(err, user) {
    if(err)
      return next(err)
    if(!user || req.user.username !== user.username || user.emailVerified)
      return next(new error.NotFound)

    req.profile = user
    next()
  })
})

/**
 * GET /account/verify/email/resend
 * Request resend of email verification token
 */
router.get('/resend', function(req, res, next) {
  if(req.user.emailVerified)
    return res.returnWith('error', req.app.config.emailVerification.messages.alreadyVerified, '/account')

  res.render('confirm', {
    title: 'Verifizierungsmail nochmals beantragen',
    preamble: 'Möchtest du erneuten Versand der Verifizierungsmail beantragen?',
    buttonText: 'Verifizierungsmail erneut senden'
  })
})

/**
 * POST /account/verify/email/resend
 * Request resend of email verification token
 */
router.post('/resend', function(req, res, next) {
  var user = req.user

  if(user.emailVerified)
    return res.returnWith('error', req.app.config.emailVerification.messages.alreadyVerified, '/account')

  user.sendEmailVerification(req.app.mailer, function(msg, err) {
    if(err)
      return next(err)

    if(msg)
      res.returnWith('error', msg, '/account')
    else
      res.returnWith('success', req.app.config.emailVerification.messages.emailSent, { email: user.email }, '/account')
  })
})

/**
 * GET /account/verify/email/:code
 * Verify email address
 */
router.get('/:code', function(req, res, next) {
  res.render('confirm', {
    title: 'E-Mail-Adresse bestätigen',
    preamble: 'Möchtest du die E-Mail-Adresse "' + req.profile.email + '" bestätigen?',
    buttonText: 'E-Mail-Adresse bestätigen'
  })
})

/**
 * POST /account/verify/email/:code
 * Verify email address
 */
router.post('/:code', function(req, res, next) {
  var user = req.profile

  user.emailVerified = true

  user.saveAndLogChanges(req.session, function(err) {
    if(err)
      return next(err)

    res.returnWith('success', req.app.config.emailVerification.messages.successfulVerification, '/account')
  })
})

/**
 * Export the router
 */
module.exports = router