var router = require('express').Router()
var auth   = require('../../auth')
var Group  = require('../../models/Group')

router.use(auth.ensureAuthenticated)

/**
 * GET /groups
 * Groups overview page
 */
router.get('/', function(req, res, next) {
  Group.find({})
  .then(function(groups) {
    res.render('groups/index', {
      title: 'Gruppen',
      groups: groups
    })
  })
  .catch(next)
})

 /**
  * Mount child routers
  */
 // router.use('/user', require('./user'))

 /**
  * Export the router
  */
 module.exports = router