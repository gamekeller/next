var error  = require('../../error')
var router = require('express').Router()

/**
 * GET /api
 * API entry point
 */
router.get('/', function(req, res) {
  res.json({
    status: 'ok'
  })
})

router.all('/', function(req, res, next) {
  next(new error.MethodNotAllowed)
})

/**
 * Mount routers
 */
router.use('/markdown', require('./markdown'))
router.use('/users', require('./users'))

/**
 * Export the router
 */
module.exports = router