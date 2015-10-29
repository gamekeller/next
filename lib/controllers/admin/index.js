var router = require('express').Router()
var auth   = require('../../auth')
var User   = require('../../models/User')

router.use(auth.ensureAuthenticated, auth.ensureAdmin)

/**
 * GET /admin
 * Admin control panel
 */
router.get('/', function(req, res, next) {
  User.find({}, function(err, users) {
    if(err)
      return next(err)

    res.render('admin/index', {
      title: 'Administration',
      users: users
    })
  })
})

/**
 * Mount child routers
 */
router.use('/user', require('./user'))

/**
 * Export the router
 */
module.exports = router