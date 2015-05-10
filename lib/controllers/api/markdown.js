var error    = require('../../error')
var markdown = require('../../markdown')
var router   = require('express').Router()

/**
 * POST /api/markdown
 * Render markdown
 */
router.post('/', function(req, res, next) {
  var text = req.body.text

  if(text == null)
    return next(new error.BadRequest('Param "text" is required.'))

  if(text.length > 16384)
    return next(new error.RequestEntityTooLarge)

  res.type('html').send(text.trim() === '' ? '' : markdown(text))
})

router.all('/', function(req, res, next) {
  next(new error.MethodNotAllowed)
})

/**
 * Export the router
 */
module.exports = router