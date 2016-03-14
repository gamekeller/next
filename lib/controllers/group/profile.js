var router = require('express').Router()
var Group  = require('../../models/Group')

/**
 * Get corresponding group for the requested profile
 */
router.param('group', function(req, res, next, id) {
  Group.findById(id, '+members', function(err, group) {
    if(err)
      return next(err)
    else if(!group)
      return next('route')

    req.group = group
    next()
  })
})

/**
 * GET /:group
 * Group profile
 */
router.get('/:group', function(req, res, next) {
  res.render('group/profile', {
    title: req.group.name,
    group: req.group
  })
})

/**
 * GET /:group/avatar
 * Redirect to group's avatar
 */
// router.get('/:group/avatar', function(req, res, next) {
//   res.redirect(req.group.avatarUrl())
// })

/**
 * Export the router
 */
module.exports = router