var config  = require('../../config')
var redis   = require('../../redis')
var utils   = require('../../utils')
var router  = require('express').Router()
var User    = require('../../models/User')

/**
 * GET /signup
 * Create a new local account
 * @param username
 * @param password
 */
router.get('/', function(req, res) {
  if(req.user && req.query.id && req.query.digest)
    return res.redirect(req.originalUrl.replace('signup', 'account/teamspeak/link'))
  if(req.user)
    return res.redirect('/')

  function render(nickname) {
    res.render('auth/signup', {
      title: 'Registrieren',
      customJs: 'signup',
      teamspeakName: nickname || null
    })
  }

  if(config.flags.teamspeakLink && req.query.id && req.query.digest) {
    var teamspeakId = utils.verifyTeamspeakLinkRequest(req.query.id, req.query.digest)

    if(teamspeakId === false) {
      console.error('Broken TeamSpeak link URL:', req.originalUrl)
      render()
    } else {
      User.count({ teamspeakUid: teamspeakId })
      .then(function(count) {
        if(count)
          return render()

        redis.$.smembers('YDL:connections:' + teamspeakId + ':clids', function(err, clids) {
          if(err)
            console.error(err)

          redis.$.hget('YDL:connections:' + teamspeakId, 'nickname' + clids[0], function(err, nickname) {
            if(err)
              console.error(err)

            render(nickname)
          })
        })
      }).catch(function() {
        render()
      })
    }
  } else {
    render()
  }
})

/**
 * POST /signup
 * @param username
 * @param email
 * @param password
 * @param consent
 */
router.post('/', function(req, res, next) {
  if(!req.app.config.flags.registration)
    return res.returnWith('error', 'Registrationen sind zur Zeit nicht erlaubt.')

  req.assert('username', 'Nutzername darf nicht leer sein').notEmpty()
  req.assert('email', 'E-Mail-Adresse darf nicht leer sein').notEmpty()
  req.assert('password', 'Passwort darf nicht leer sein').notEmpty()
  req.assert('confirmPassword', 'Passwörter stimmen nicht überein').equals(req.body.password)
  req.assert('consent','Zur Datenverarbeitung muss der Datenschutzerklärung zugestimmt werden').equals('on')

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array())

    var user = new User({
      username: req.body.username,
      email: req.body.email,
      teamspeak: req.body.teamspeak,
      password: req.body.password,
      consent: true
    })

    var done = []

    if(config.flags.teamspeakLink && req.query.id && req.query.digest) {
      var teamspeakId = utils.verifyTeamspeakLinkRequest(req.query.id, req.query.digest)

      if(teamspeakId !== false) {
        done.push(
          User.count({ teamspeakUid: teamspeakId })
          .then(function(count) {
            if(!count) {
              user.teamspeakUid = teamspeakId
            }
          })
        )
      }
    }

    Promise.all(done).then(function() {
      user.save(function(err) {
        if(err)
          return res.handleMongooseError(err, next)

        user.sendEmailVerification(req.app.mailer, function(msg, err) {
          if(err)
            return next(err)

          if(msg)
            req.flash('error', msg)
          else
            req.flash('success', req.app.config.emailVerification.messages.emailSent, { email: user.email })

          req.logIn(user, function(err) {
            if(err)
              return next(err)

            res.returnWith('success', '<strong>Hurra!</strong> Dein Account wurde erfolgreich erstellt.', req.session.returnTo || '/')
          })
        }, { isRegistration: true })
      })
    })
  })
})

/**
 * Export the router
 */
module.exports = router