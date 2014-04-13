var router = require('express').Router()

/**
 * GET /
 * Home page
 */
router.get('/', function(req, res) {
  res.render('home', {
    title: 'Gamekeller'
  })
})

/**
 * Export the router
 */
module.exports = router