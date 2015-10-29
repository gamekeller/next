var _      = require('lodash')
var router = require('express').Router()
var User   = require('../models/User')

/**
 * GET /
 * Home page
 */
router.get('/', function(req, res) {
  if(!req.user)
    return res.render('landing', {
      title: 'Gamekeller',
      customCss: 'landing'
    })

  User.find({ _id: { $in: req.user.friends }, teamspeakLinked: true }, 'username teamspeakUid teamspeakLinked', function(err, users) {
    users = _.filter(users, 'teamspeakOnline')

    res.render('home', {
      title: 'Gamekeller',
      friendsOnTeamspeak: users,
      customJs: 'home'
    })
  })
})

/**
 * GET /members
 * Members page
 */
router.get('/members', function(req, res) {
  User.find({}, function(err, users) {
    res.render('members', {
      title: 'Mitglieder',
      members: users
    })
  })
})

/**
 * GET /landing
 * Explicitly render landing page
 */
router.get('/landing', function(req, res) {
  res.render('landing', {
    title: 'Gamekeller',
    customCss: 'landing'
  })
})

/**
 * GET /imprint
 * Imprint page
 */
router.get('/imprint', function(req, res) {
  res.render('imprint', {
    title: 'Impressum'
  })
})

/**
 * GET /privacy
 * Privacy policy page
 */
router.get('/privacy', function(req, res) {
  res.render('privacy', {
    title: 'Datenschutz'
  })
})

/**
 * Export the router
 */
module.exports = router