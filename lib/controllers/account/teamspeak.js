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
  if(!req.query.id || req.query.id.length % 2 !== 0 || !/[0-9a-f]/.test(req.query.id) || !req.query.digest || !/[0-9a-f]/.test(req.query.digest))
    return next(new error.BadRequest())

  var id = new Buffer(req.query.id, 'hex').toString()
  var digest = utils.createSha1Hmac(id, config.teamspeak.link.key)

  if(digest !== req.query.digest)
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
  })
  .catch(next)
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

  user.teamspeakUid = ''

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