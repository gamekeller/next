var router = require('express').Router()

/**
 * GET /account/rankup
 * Rankup page
 */
// router.get('/', function(req, res) {
//   res.render('account/rankup', {
//     title: 'Rang erhöhen'
//   })
// })

/**
 * POST /account/rankup
 * Rank up
 */
router.post('/', function(req, res, next) {
  if(!req.user.canRankUp())
    return res.returnWith('error', 'Dein Rang kann nicht erhöht werden.', '/')

  req.user.rankUp()

  req.user.save().then(function() {
    return res.redirect('/')
  }).catch(next)
})

/**
 * Export the router
 */
module.exports = router