var _     = require('lodash')
var User  = require('../models/User')
var Medal = require('../models/Medal')

function exists(username, next, callback) {
  User.findOne({ username: username }, 'username email createdAt profile', function(err, user) {
    if(err)
      return next(err)

    if(user)
      callback(user)
    else
      return next()
  })
}

/**
 * GET /@:username
 * Profile page
 */
exports.getProfile = function(req, res, next) {
  exists(req.params.user, next, function(user) {
    Medal.find({}, function(err, medals) {
      if(err)
        return next(err)

      res.render('account/profile', {
        title: user.username,
        profile: user,
        medals: medals
      })
    })
  })
}

/**
 * GET /@:username/medals
 * All medals of a user
 */
exports.getMedals = function(req, res, next) {
  exists(req.params.user, next, function(user) {
    res.send(user.username + ' exists!')
  })
}

/**
 * POST /@:username/medals
 */
exports.postMedals = function(req, res, next) {
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
}