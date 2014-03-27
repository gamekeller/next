var User  = require('../models/User')
var Medal = require('../models/Medal')

function exists(username, next, callback) {
  User.findOne({ username: username }, 'username email createdAt profile -_id', function(err, user) {
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
    var userMedals = req.body.medals

    Medal.find({}, function(err, medals) {
      if(err)
        return next(err)

      var medalIds = []

      medals.forEach(function(medal) { medalIds.push(medal._id) })

      userMedals.forEach(function(medal, i) {
        if(medal in medalIds) {
          //user
        }
      })

      res.redirect('/@' + req.params.user)
    })
  })
}