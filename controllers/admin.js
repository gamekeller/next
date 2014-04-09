var User = require('../models/User')

/**
 * GET /admin
 * Admin control panel
 */
exports.getAdmin = function(req, res, next) {
  User.find({}, function(err, users) {
    if(err)
      return next(err)

    res.render('admin', {
      title: 'Admin Page',
      users: users.reverse()
    })
  })
}