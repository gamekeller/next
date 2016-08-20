var _      = require('lodash')
var error  = require('../../error')
var router = require('express').Router()
var User   = require('../../models/User')
var utils  = require('../../utils')

/**
 * Get corresponding user for the requested profile
 */
router.param('user', function(req, res, next, id) {
  if(!utils.isValidObjectId(id))
    return next('route')

  User.findById(id, '+friends', function(err, user) {
    if(err)
      return next(err)
    else if(!user)
      return next('route')

    req.profile = user
    next()
  })
})

/**
 * GET /:user
 * Profile page
 */
router.get('/:user', function(req, res, next) {
  res.render('account/profile', {
    title: req.profile.username,
    profile: req.profile,
    customJs: 'profile'
  })
})

/**
 * POST /:user
 * Update profile page
 */
router.post('/:user', function(req, res, next) {
  var user = req.user
  var data = req.body

  if(!user || user.username !== req.profile.username)
    return next(new error.Unauthorized)

  user.bio.source = data.profile.bio

  user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', req.app.config.profile.bio.messages.successfullySaved)
  })
})

/**
 * GET /:user/avatar
 * Profile page
 */
router.get('/:user/avatar', function(req, res, next) {
  res.redirect(req.profile.avatarUrl())
})

/**
 * GET /:user/friends
 * List all friends of a user
 */
router.get('/:user/friends', function(req, res, next) {
  var user = req.user

  if(!user || user.username !== req.profile.username)
    return next(new error.NotFound)

  req.profile.populate({
    path: 'friends',
    select: 'username avatar teamspeakUid teamspeakLinked teamspeakOnline teamspeakConnections'
  }, function(err, profile) {
    if(err)
      return res.handleMongooseError(err, next)

    res.render('account/friends', {
      title: 'Freunde',
      profile: profile
    })
  })
})

/**
 * POST /:user/befriend
 * Befriend a user
 */
router.post('/:user/befriend', function(req, res, next) {
  var user = req.user

  if(!user || user.username === req.profile.username)
    return next(new error.Unauthorized)
  if(user.friendsWith(req.profile.id))
    return next(new error.Forbidden)

  user.friends.push(req.profile.id)

  user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', req.app.config.friendship.messages.befriend, { username: req.profile.username }, req.headers.referer)
  })
})

/**
 * POST /:user/unfriend
 * Unfriend a user
 */
router.post('/:user/unfriend', function(req, res, next) {
  var user = req.user

  if(!user || user.username === req.profile.username)
    return next(new error.Unauthorized)
  if(!user.friendsWith(req.profile.id))
    return next(new error.Forbidden)

  user.friends = _.without(user.friends, req.profile.id)

  user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', req.app.config.friendship.messages.unfriend, { username: req.profile.username }, req.headers.referer)
  })
})

/**
 * Export the router
 */
module.exports = router