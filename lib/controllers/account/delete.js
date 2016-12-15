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

  req.getValidationResult().then(function(result) {
    if(!result.isEmpty())
      return res.returnWith('error', result.array())

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
})

/**
 * Export the router
 */
module.exports = router