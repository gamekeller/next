var router = require('express').Router()
var _      = require('lodash')
var pass   = require('../config/passport')
var User   = require('../models/User')
var Medal  = require('../models/Medal')

router.param('user', function(req, res, next, name) {
  User.findOne({ username: name }, function(err, user) {
    if(err)
      return next(err)
    else if(!user)
      return next(new Error(404))

    req.profile = user
    next()
  })
})

/**
 * GET /@:user
 * Profile page
 */
router.get('/@:user', function(req, res, next) {
  Medal.find().exec().then(function(medals) {
    res.render('account/profile', {
      title: req.profile.username,
      profile: req.profile,
      medals: medals
    })
  }, next)
})

/**
 * GET /@:user/medals
 * All medals of a user
 */
router.get('/@:user/medals', function(req, res, next) {
  res.send(req.profile.username + ' exists!')
})

/**
 * POST /@:user/medals
 */
router.post('/@:user/medals', pass.ensureAuthenticated, pass.ensureAdmin(), function(req, res, next) {
  exists(req.params.user, next, function(user) {
    Medal.find({}, '_id', function(err, medals) {
      if(err)
        return next(err)

      var now        = _.now()
      var userMedals = _.transform(user.profile.medals, function(result, medal) { result[medal.id] = medal })
      medals         = _.map(medals, function(medal) { return medal._id.toString() })

      user.profile.medals = _(req.body.medals)
        .keys()
        .remove(function(id) { return _.contains(medals, id) && req.body.medals[id] === 'on' })
        .each(function(id, i, arr) {
          if(_.has(userMedals, id))
            arr[i] = userMedals[id]
          else
            arr[i] = {
              id: id.toString(),
              date: now
            }
        })
        .value()

        user.save(function(err) {
          if(err)
            return next(err)

          res.redirect('/@' + req.params.user)
        })
    })
  })
})

/**
 * Export the router
 */
module.exports = router