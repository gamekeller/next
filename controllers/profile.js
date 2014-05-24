var router = require('express').Router()
var User   = require('../models/User')

/**
 * Only show profiles when logged in
 */
router.use(function(req, res, next) {
  if(!req.user)
    return next(new Error(404))
  else
    next()
})

/**
 * Get corresponding user for the requested profile
 */
router.param('user', function(req, res, next, name) {
  User.findOne({ username: name }, function(err, user) {
    if(err)
      return next(err)
    else if(!user)
      return next(new Error(404))

    req.profile = user
    next()
  })
})

/**
 * GET /@:user
 * Profile page
 */
router.get('/@:user', function(req, res, next) {
  res.render('account/profile', {
    title: req.profile.username,
    profile: req.profile
  })
})

/**
 * Export the router
 */
module.exports = router