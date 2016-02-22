var _       = require('lodash')
var router  = require('express').Router()
var User    = require('../../models/User')
var History = require('../../models/History')
var utils   = require('../../utils')

/**
 * GET /admin/user/:username
 * Redirect username to ID
 */
router.get('/:username', function(req, res, next) {
  User.findOne({ username: req.params.username }, '_id', function(err, user) {
    if(err)
      return next(err)
    if(!user)
      return next('route')

    res.redirect(req.resolveUrl('../' + user._id))
  })
})

/**
 * Get corresponding document for the requested user ID
 */
router.param('userid', function(req, res, next, id) {
  if(!utils.isValidObjectId(id))
    return next('route')

  User.findById(id, '+sessions', function(err, user) {
    if(err)
      return next(err)
    else if(!user)
      return next('route')

    var url = '/admin/user/' + user.id

    res.locals.userNav = [
      { href: url + '/edit', name: 'Bearbeiten', view: 'admin/user/edit' },
      { href: url + '/sessions', name: 'Sessions', view: 'admin/user/sessions' },
      { href: url + '/history', name: 'Verlauf', view: 'admin/user/history' }
    ]

    if (user.teamspeakLinked) {
      res.locals.userNav.unshift({ href: url, name: 'Übersicht', view: 'admin/user/overview' })
    }

    req.profile = user

    next()
  })
})

/**
 * GET /admin/user/:userid
 * Display overview for user
 */
router.get('/:userid', function(req, res) {
  if (!req.profile.teamspeakLinked) {
    return res.redirect(req.originalUrl + '/edit')
  }

  res.render('admin/user/overview', {
    title: req.profile.username,
    profile: req.profile
  })
})

/**
 * GET /admin/user/:userid/edit
 * Edit user page
 */
router.get('/:userid/edit', function(req, res, next) {
  res.render('admin/user/edit', {
    title: req.profile.username + '.edit',
    profile: req.profile
  })
})

/**
 * POST /admin/user/:userid/edit
 * Edit user
 */
router.post('/:userid/edit', function(req, res, next) {
  var user = req.profile
  var data = req.body.user

  if(data.password === '')
    delete data.password

  _.each(['emailVerified', 'admin'], function(prop) {
    data[prop] = data[prop] === 'on' ? true : false
  })

  user.merge(data)

  user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', req.app.config.admin.user.messages.successfullyUpdated, { username: user.username })
  })
})

/**
 * GET /admin/user/:userid/sessions
 * Display a user's sessions
 */
router.get('/:userid/sessions', function(req, res, next) {
  req.profile.getSessions(req.session.id)
  .then(function(sessions) {
    res.render('admin/user/sessions', {
      title: req.profile.username + '.sessions',
      profile: req.profile,
      sessions: sessions
    })
  })
  .catch(function(err) {
    next(err)
  })
})

/**
 * GET /admin/user/:userid/history
 * Display a user's security history
 */
router.get('/:userid/history', function(req, res) {
  History.find({ owner: req.profile._id }, null, { sort: { createdAt: -1 } })
  .then(function(history) {
    res.render('admin/user/history', {
      title: req.profile.username + '.sessions',
      profile: req.profile,
      history: history
    })
  })
})

/**
 * POST /admin/user/:userid/sendPasswordReset
 * Send password reset email to user's email address
 */
router.post('/:userid/sendPasswordReset', function(req, res, next) {
  req.profile.sendPasswordReset(req.app.mailer, function(msg, err) {
    if(err)
      return next(err)

    if(msg)
      res.returnWith('error', msg, req.resolveUrl('../'))
    else
      res.returnWith('success', req.app.config.forgotPassword.messages.emailSent, { email: req.profile.email }, req.resolveUrl('../edit'))
  }, true)
})

/**
 * POST /admin/user/:userid/sendEmailVerification
 * Send email verification link to user's email address
 */
router.post('/:userid/sendEmailVerification', function(req, res, next) {
  req.profile.sendEmailVerification(req.app.mailer, function(msg, err) {
    if(err)
      return next(err)

    if(msg)
      res.returnWith('error', msg, req.resolveUrl('../'))
    else
      res.returnWith('success', req.app.config.emailVerification.messages.emailSent, { email: req.profile.email }, req.resolveUrl('../edit'))
  }, true)
})

/**
 * POST /admin/user/:userid/delete
 * Delete user account
 */
router.post('/:userid/delete', function(req, res, next) {
  req.profile.remove(function(err, user) {
    if(err)
      return next(err)

    res.returnWith('success', 'Account gelöscht.', '/admin')
  })
})

/**
 * Export the router
 */
module.exports = router