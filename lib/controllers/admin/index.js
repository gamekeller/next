var router = require('express').Router()
var auth   = require('../../auth')

router.use(auth.ensureAuthenticated, auth.ensureAdmin)

/**
 * Mount child routers
 */
router.use('/user', require('./user'))
router.use('/kb', require('./kb'))

/**
 * Export the router
 */
module.exports = router