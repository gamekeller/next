var router = require('express').Router()

/**
 * GET /logout
 * Display log out page
 */
router.get('/', function(req, res, next) {
  if(!req.user)
    return res.redirect('/')

  res.render('confirm', {
    title: 'Logout',
    preamble: 'Bist du dir sicher, dass du dich ausloggen möchtest?',
    buttonText: 'Ausloggen'
  })
})

/**
 * POST /logout
 * Log out
 */
router.post('/', function(req, res, next) {
  req.logout(function(err) {
    if(err)
      return next(err)

    res.redirect(req.session.returnTo || '/')
  })
})

/**
 * Export the router
 */
module.exports = router