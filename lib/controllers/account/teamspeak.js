var config   = require('../../config')
var messages = config.teamspeakLink.messages
var utils    = require('../../utils')
var error    = require('../../error')
var router   = require('express').Router()
var User     = require('../../models/User')

/**
 * GET /account/teamspeak/link
 * Link Teamspeak identity
 */
router.get('/link', function(req, res, next) {
  if(!config.flags.teamspeakLink)
    return res.returnWith('error', messages.unavailble, '/account')
  if(req.user.teamspeakLinked)
    return res.returnWith('error', messages.alreadyLinked, '/account')

  var id = utils.verifyTeamspeakLinkRequest(req.query.id, req.query.digest)

  if(id === false)
    return next(new error.BadRequest())

  User.count({ teamspeakUid: id })
  .then(function(count) {
    if(count)
      return res.returnWith('error', messages.idAlreadyLinked, '/account')

    req.user.teamspeakUid = id

    req.user.saveAndLogChanges(req.session, function(err) {
      if(err)
        return res.handleMongooseError(err, next)

      res.returnWith('success', messages.successfulLink, '/account')
    })
  }, next)
})

/**
 * POST /account/teamspeak/unlink
 * Unlink Teamspeak identity
 */
router.post('/unlink', function(req, res, next) {
  var user = req.user

  if(!config.flags.teamspeakLink)
    return res.returnWith('error', messages.unavailble, '/account')
  if(!user.teamspeakLinked)
    return res.returnWith('error', messages.nothingToUnlink, '/account')

  user.teamspeakUid = undefined

  user.saveAndLogChanges(req.session, function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', messages.successfulUnlink, '/account')
  })
})

/**
 * Export the router
 */
module.exports = router