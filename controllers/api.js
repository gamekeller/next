var router = require('express').Router()
var User   = require('../models/User')

router.param('user', function(req, res, next, name) {
  User.findOne({ username: name }, function(err, user) {
    if(err)
      return next(err)
    else if(!user) {
      var err = new Error(404)
      err.force = 'json'
      return next(err)
    }

    req.profile = user
    next()
  })
})

/**
 * GET /
 * Index
 */
router.get('/', function(req, res) {
  res.send({
    hello: 'there'
  })
})

/**
 * GET /users
 * List of users
 */
router.get('/users', function(req, res) {
  res.send({
    willBe: 'a list of users'
  })
})

/**
 * GET /users/:user
 * Specific user
 */
router.get('/users/:user', function(req, res) {
  res.send({
    username: req.profile.username,
    profile: req.profile.profile,
    gravatar: req.profile.gravatar()
  })
})

/**
 * Export the router
 */
module.exports = router