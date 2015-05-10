var router = require('express').Router()

/**
 * GET /account/delete
 * Delete account page
 */
router.get('/', function(req, res) {
  res.render('account/delete', {
    title: 'Account löschen',
    customJs: 'delete'
  })
})

/**
 * POST /account/delete
 * Delete account
 */
router.post('/', function(req, res, next) {
  req.assert('password', 'Passwort darf nicht leer sein.').notEmpty()

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  req.user.comparePassword(req.body.password, function(err, isMatch) {
    if(err)
      return next(err)

    if(!isMatch) {
      return res.returnWith('error', 'Falsches Password.')
    } else {
      req.user.remove(function(err, user) {
        if(err)
          return next(err)

        req.session.destroy(function(err) {
          if(err)
            return next(err)

          res.redirect('/')
        })
      })
    }
  })
})

/**
 * Export the router
 */
module.exports = router