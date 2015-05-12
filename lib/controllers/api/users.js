var _      = require('lodash')
var config = require('../../config')
var error  = require('../../error')
var router = require('express').Router()
var User   = require('../../models/User')
var fields = ['username', 'gravatarId', 'bio', 'teamspeakOnline', 'teamspeakConnections', 'teamspeakLinked', 'teamspeakRank', 'createdAt']

/**
 * Sanitize user profile
 */
function makeUserObject(user, url) {
  user = _.pick(user, fields)

  if(!user.teamspeakLinked)
    user.teamspeakOnline = null

  if(!user.teamspeakLinked || !user.teamspeakOnline)
    user.teamspeakConnections = []

  user.url     = config.url + url
  user.htmlUrl = config.url + '/' + user.username

  return user
}

/**
 * Username param
 */
router.param('username', function(req, res, next, username) {
  User.findOne({ username: username }, function(err, user) {
    if(err)
      return next(err)
    if(!user)
      return next('route')

    req.profile = user

    next()
  })
})

/**
 * GET /api/users
 * User entry point
 */
router.get('/', function(req, res, next) {
  User.find({}, fields.join(' '), { limit: 100 }, function(err, users) {
    users = _.map(users, function(user) {
      return makeUserObject(user, req.originalUrl + '/' + user.username)
    })

    res.json(users)
  })
})

/**
 * GET /api/users/:username
 * User data
 */
router.get('/:username', function(req, res, next) {
  res.json(makeUserObject(req.profile, req.originalUrl))
})

router.all('/', function(req, res, next) {
  next(new error.MethodNotAllowed)
})

/**
 * Export the router
 */
module.exports = router