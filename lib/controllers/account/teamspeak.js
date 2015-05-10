var config    = require('../../config')
var messages  = config.teamspeakLink.messages
var router    = require('express').Router()
var teamspeak = require('../../teamspeak')
var User      = require('../../models/User')

/**
 * POST /account/teamspeak/link
 * Link Teamspeak identity
 */
router.post('/link', function(req, res, next) {
  if(!config.flags.teamspeakLink)
    return res.returnWith('error', messages.unavailble, '/account')
  if(req.user.teamspeakLinked)
    return res.returnWith('error', messages.alreadyLinked, '/account')

  teamspeak.findByNickname(req.user.teamspeakLink.code).then(function(client) {
    User.findOne({ teamspeakUid: client.client_unique_identifier }, function(err, user) {
      if(err)
        return next(err)
      if(user)
        return res.returnWith('error', messages.idAlreadyLinked, '/account')

      req.user.teamspeakUid = client.client_unique_identifier

      req.user.saveAndLogChanges(req.session, function(err) {
        if(err)
          return res.handleMongooseError(err, next)

        res.returnWith('success', messages.successfulLink, '/account')
      })
    })
  })
  .catch(function() {
    res.returnWith('error', messages.failedLink, '/account')
  })
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
 * POST /account/teamspeak/regenerateCode
 * Regenerate linking code
 */
router.post('/regenerateCode', function(req, res, next) {
  if(!config.flags.teamspeakLink)
    return res.returnWith('error', messages.unavailble, '/account')
  if(req.user.teamspeakLinked)
    return res.returnWith('error', messages.alreadyLinked, '/account')

  req.user.regenerateTeamspeakLinkCode()

  req.user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', messages.codeRegenerated, '/account')
  })
})

/**
 * Export the router
 */
module.exports = router