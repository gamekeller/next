var router   = require('express').Router()
var passport = require('passport')
var pass     = require('../config/passport')
var User     = require('../models/User')

/**
 * GET /logout
 * Log out
 */
router.get('/logout', function(req, res) {
  req.logout()
  res.redirect('/')
})

/**
 * GET /login
 * Login page
 */
router.get('/login', function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('account/login', {
    title: 'Login',
    special: true
  })
})

/**
 * POST /login
 * Sign in using username and password
 * @param username
 * @param password
 */
router.post('/login', function(req, res, next) {
  req.assert('username', 'Username is not valid').isAlphanumeric().len(3, 16)
  req.assert('password', 'Password cannot be blank').notEmpty()

  var errors = req.validationErrors()

  if(errors) {
    req.flash('errors', errors)
    return res.redirect('/login')
  }

  passport.authenticate('local', function(err, user, info) {
    if(err)
      return next(err)

    if(!user) {
      req.flash('errors', { msg: info.message })
      return res.redirect('/login')
    }

    req.logIn(user, function(err) {
      if(err)
        return next(err)

      req.flash('success', { msg: '<strong>Success!</strong> You are logged in.' })
      return res.redirect(req.query.returnTo || '/')
    })
  })(req, res, next)
})

/**
 * GET /signup
 * Create a new local account
 * @param username
 * @param password
 */
router.get('/signup', function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('account/signup', {
    title: 'Registrieren',
    special: true
  })
})

/**
 * POST /signup
 * @param username
 * @param email
 * @param password
 */
router.post('/signup', function(req, res, next) {
  // TEMP: don't allow signups
  req.flash('errors', [{ msg: 'Sign-ups are not permitted at this time.' }])
  return res.redirect('/signup')

  req.assert('username', 'Username must not be empty').notEmpty()
  req.assert('username', 'Username may only contain alphanumeric characters').isAlphanumeric()
  req.assert('username', 'Username must range between 3 and 16 characters in length').len(3, 16)
  req.assert('email', 'eMail address must not be empty').notEmpty()
  req.assert('email', 'eMail address is not valid').isEmail()
  req.assert('password', 'Password must not be empty').notEmpty()
  req.assert('password', 'Password must be at least 4 characters long').len(4)
  req.assert('password', 'Password must not contain whitespace characters').matches(/^[^\s]+$/)
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password)

  var errors = req.validationErrors()

  if(errors) {
    req.flash('errors', errors)
    return res.redirect('/signup')
  }

  var user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    admin: false
  })

  user.save(function(err) {
    if(err) {
      if(err.code === 11000)
        req.flash('errors', { msg: 'User with that username already exists.' })

      return res.redirect('/signup')
    }

    req.logIn(user, function(err) {
      if(err)
        return next(err)

      req.flash('success', { msg: 'Success! You are logged in.' })
      res.redirect(req.query.returnTo || '/')
    })
  })
})

/**
 * GET /account
 * Profile settings page
 */
router.get('/account', pass.ensureAuthenticated, function(req, res) {
  res.render('account/settings', {
    title: 'Account'
  })
})

/**
 * POST /account
 * Update account settings
 */
router.post('/account', pass.ensureAuthenticated, function(req, res, next) {
  var user = req.user
  var data = req.body

  req.assert('account.email', 'eMail address must not be empty').notEmpty()
  req.assert('account.email', 'eMail address is not valid').isEmail()

  if(data.account.password !== '') {
    req.assert('account.password', 'Password must be at least 4 characters long').len(4)
    req.assert('account.password', 'Password must not contain whitespace characters').matches(/^[^\s]+$/)
    req.assert('confirmPassword', 'Password confirmation field must not be empty').notEmpty()
    req.assert('confirmPassword', 'Passwords do not match').equals(data.account.password)
  }

  var errors = req.validationErrors()

  if(errors) {
    req.flash('errors', errors)
    return res.redirect('/account')
  }

  user.email = data.account.email

  if(data.account.password !== '')
    user.password = data.account.password

  user.save(function(err) {
    if(err)
      return next(err)

    req.flash('success', { msg: '<strong>Success!</strong> Your account settings were updated.' })
    res.redirect('/account')
  })
})

/**
 * Export the router
 */
module.exports = router