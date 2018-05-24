var Promise = require('bluebird')
var _       = require('lodash')
var router  = require('express').Router()
var User    = require('../models/User')


router.use((req, res, next) => {
  console.log(req.path)
  let allowedPaths = new Set(['/privacy', '/account/delete','/logout'])
  if(req.user && !req.user.consent && !allowedPaths.has(req.path))
    return res.returnWith('error', 'Um fortzufahren, stimme  bitte der neuen Einwilligungserklärung zu', '/privacy')
  else
    next()
})
/**
 * GET /
 * Home page
 */
router.get('/', function(req, res, next) {
  if(!req.user)
    return res.render('landing', {
      title: 'Gamekeller',
      customCss: 'landing'
    })

  User.find({ _id: { $in: req.user.friends } }, 'username avatar teamspeakUid teamspeakLinked').sort({ username: 1 }).then(function(friends) {
    res.render('home', {
      title: 'Gamekeller',
      friends: _.orderBy(friends, 'teamspeakOnline', 'desc'),
      customJs: 'home'
    })
  }).catch(next)
})

/**
 * GET /members
 * Members page
 */
router.get('/members', function(req, res) {
  Promise.join(
    User.find().sort({ rank: -1, level: -1, createdAt: 1 }).select('username rank level avatar teamspeakUid teamspeakLinked'),
    User.aggregate([{ $match: {} }, { $group: { _id: 'all', xp: { $sum: '$xp.total' } }}]),
    function(users, totalXp) {
      res.render('members', {
        title: 'Mitglieder',
        members: users,
        totalXp: totalXp[0].xp
      })
    }
  )
})

/**
 * GET /landing
 * Explicitly render landing page
 */
router.get('/landing', function(req, res) {
  res.render('landing', {
    title: 'Gamekeller',
    customCss: 'landing'
  })
})

/**
 * GET /imprint
 * Imprint page
 */
router.get('/imprint', function(req, res) {
  res.render('imprint', {
    title: 'Impressum'
  })
})

/**
 * GET /privacy
 * Privacy policy page
 */
router.get('/privacy', function(req, res) {
  res.render('privacy', {
    title: 'Datenschutz'
  })
})
/**
 * POST /privacy
 * Accept the privacy policy
* @param consent
 */
router.post('/privacy', (req,res) => {
  req.user.consent = true
  req.user.save(function(err) {
    if(err)
      return res.handleMongooseError(err, next)

    res.returnWith('success', 'Du hast der Datenschutzerklärung zu gestimmt!', '/account')
  })
})

/**
 * GET /cookies
 * Cookie policy page
 */
router.get('/cookies', function(req, res) {
  res.render('cookies', {
    title: 'Cookies'
  })
})

/**
 * Export the router
 */
module.exports = router