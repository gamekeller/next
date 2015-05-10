var platform = require('platform')
var router   = require('express').Router()
var User     = require('../models/User')
var redis    = require('../redis')
var auth     = require('../auth')
var utils    = require('../utils')
var without  = require('lodash-node/modern/arrays/without')

router.use(auth.ensureAuthenticated)

/**
 * POST /session/:id/revoke
 * Revokes access for a given session
 */
router.post('/:id/revoke', function(req, res, next) {
  var id = req.params.id

  if(!utils.isValidObjectId(id))
    return next('route')

  redis.getSessionById(id).then(function(session) {
    if(!session)
      return next('route')

    var passport = session.passport

    if(req.session.id === id || !passport || !passport.user || (passport.user !== req.user.id && req.user.admin !== true))
      return next('route')

    User.findById(passport.user, 'history sessions', function(err, user) {
      if(err)
        return next(err)
      if(!user)
        return next('route')

      user.sessions = without(user.sessions, id)

      redis.getSessionById(id).then(function(session) {
        var browser = platform.parse(session.userAgent)
        browser.os  = browser.os.toString()
        user.log('user.revoke_session', req.session, {
          'Annullierte Session': {
            'Zeitpunkt des LoginsAt': session.createdAt,
            'Zeitpunkt der letzten NutzungAt': session.usedAt,
            'IP-Adresse': session.ipAddress,
            'Browser': browser
          }
        })

        user.save(function(err) {
          if(err)
            return next(err)

          redis.$.del('sess:' + id, function(err) {
            if(err)
              return next(err)

            res.returnWith('success', 'Zugang wurde annulliert.', req.session.returnTo || '/')
          })
        })
      }).catch(next)
    })
  }).catch(next)
})

/**
 * Export the router
 */
module.exports = router