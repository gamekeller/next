var router = require('express').Router()

/**
 * GET /account/security
 * Account security page
 */
router.get('/', function(req, res, next) {
  req.user.getSessions(req.session.id, function(err, sessions) {
    if(err)
      return next(err)

    res.render('account/security', {
      title: 'Sicherheit',
      sessions: sessions
    })
  })
})

/**
 * Export the router
 */
module.exports = router