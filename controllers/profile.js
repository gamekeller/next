var User  = require('../models/User')
var Medal = require('../models/Medal')

/**
 * GET /@:username
 * Profile page
 */
exports.getProfile = function(req, res, next) {
  User.findOne({ username: req.params.user }, 'username createdAt profile -_id', function(err, user) {
    if(err)
      return next(err)

    if(user)
      Medal.find({}, function(err, medals) {
        if(err)
          return next(err)

        res.render('account/profile', { profile: user, medals: medals })
      })
    else
      res.send(404, 'A user with the name of ' + req.params.user + ' was not found! Sorry about that.')
  })
}