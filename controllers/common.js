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
 * GET /imprint
 * Imprint page
 */
router.get('/imprint', function(req, res) {
  res.render('imprint', {
    title: 'Impressum',
    special: true
  })
})

/**
 * GET /privacy
 * Imprint page
 */
router.get('/privacy', function(req, res) {
  res.render('privacy', {
    title: 'Datenschutz',
    special: true
  })
})

/**
 * Export the router
 */
module.exports = router