var Promise = require('bluebird')
var History = require('../../models/History')
var router = require('express').Router()

/**
 * GET /account/security
 * Account security page
 */
router.get('/', function(req, res, next) {
  Promise.props({
    history: History.find({ owner: req.user._id }, null, { limit: 30, sort: { createdAt: -1 } }),
    sessions: req.user.getSessions(req.session.id)
  })
  .then(function(result) {
    res.render('account/security', {
      title: 'Sicherheit',
      history: result.history,
      sessions: result.sessions
    })
  })
  .catch(function(err) {
    next(err)
  })
})

/**
 * Export the router
 */
module.exports = router