var router = require('express').Router()
var Handle = require('../models/Handle')

router.param('handle', function(req, res, next, param) {
  if(param === 'user' || param === 'group')
    return next('route')

  Handle.findOne({ path: param.toLowerCase() })
  .then(function(handle) {
    if(!handle)
      return next('route')

    req.handle = handle

    next()
  })
  .catch(next)
})

/**
 * Vanity handles
 */
router.all('/:handle*', function(req, res, next) {
  var handle = req.handle
  req.url = '/' + handle.target.type + '/' + handle.target.id + req.originalUrl.slice(handle.path.length + 1)
  next()
})

/**
 * Mount child routers
 */
router.use('/user', require('./user'))
router.use('/group', require('./group/profile'))

/**
 * Export the router
 */
module.exports = router