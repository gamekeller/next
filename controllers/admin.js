var router = require('express').Router()
var pass   = require('../config/passport')
var User   = require('../models/User')

/**
 * GET /admin
 * Admin control panel
 */
router.get('/admin', pass.ensureAuthenticated, pass.ensureAdmin(), function(req, res, next) {
  User.find({}, function(err, users) {
    if(err)
      return next(err)

    res.render('admin', {
      title: 'Admin Page',
      users: users.reverse()
    })
  })
})

/**
 * Export the router
 */
module.exports = router