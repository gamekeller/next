var config   = require('../../config')
var messages = config.teamspeakLink.messages
var utils    = require('../../utils')
var error    = require('../../error')
var router   = require('express').Router()
var User     = require('../../models/User')

function handleLinkRequest(req, res, next) {
  if(!config.flags.teamspeakLink)
    return res.returnWith('error', messages.unavailble, '/account')

  var id = utils.verifyTeamspeakLinkRequest(req.query.id, req.query.digest)

  if(id === false)
    return next(new error.BadRequest())

  User.count({ teamspeakUid: id })
  .then(function(count) {
    if(count)
      return res.returnWith('error', messages.idAlreadyLinked, '/account')

    if(req.user.teamspeakLinked && req.method === 'GET')
      return res.render('confirm', {
        title: 'TeamSpeak-ID ersetzen',
        preamble: 'Dieser Account ist bereits mit einer TeamSpeak-ID verknüpft. Möchtest du diese Verknüpfung aufheben und die neue TeamSpeak-ID verwenden?',
        buttonText: 'Neue TeamSpeak-ID verwenden',
        abort: {
          href: '/account',
          text: 'Bisherige TeamSpeak-ID weiter verwenden'
        }
      })

    req.user.teamspeakUid = id

    req.user.saveAndLogChanges(req.session, function(err) {
      if(err)
        return res.handleMongooseError(err, next)

      res.returnWith('success', messages.successfulLink, '/account')
    })
  }, next)
}

/**
 * GET /account/teamspeak/link
 * Link Teamspeak identity
 */
router.get('/link', handleLinkRequest)

/**
 * POST /account/teamspeak/link
 * Replace TeamSpeak identity
 */
router.post('/link', handleLinkRequest)

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