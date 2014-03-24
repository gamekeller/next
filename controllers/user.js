var passport = require('passport')
var User     = require('../models/User')
var Medal    = require('../models/Medal')

/**
 * GET /login
 * Log out
 */
exports.getLogout = function(req, res) {
  req.logout()
  res.redirect('/')
}

/**
 * GET /login
 * Login page
 */
exports.getLogin = function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('account/login', {
    title: 'Login'
  })
}

/**
 * POST /login
 * Sign in using username and password
 * @param username
 * @param password
 */
exports.postLogin = function(req, res, next) {
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

      // res.locals.user = user
      req.flash('success', { msg: 'Success! You are logged in.' })
      return res.redirect(req.session.returnTo || '/')
    })
  })(req, res, next)
}

/**
 * GET /signup
 * Create a new local account
 * @param username
 * @param password
 */
exports.getSignup = function(req, res) {
  if(req.user)
    return res.redirect('/')

  res.render('account/signup', {
    title: 'Sign Up'
  })
}

/**
 * POST /signup
 * @param username
 * @param email
 * @param password
 */
exports.postSignup = function(req, res, next) {
  req.assert('username', 'Username is not valid').isAlphanumeric().len(3, 16)
  req.assert('email', 'Email is not valid').isEmail()
  req.assert('password', 'Password must be at least 4 characters long').matches(/^[^\s]+$/).len(4)
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
        req.flash('errors', { msg: 'User with that username alread exists.' })

      return res.redirect('/signup')
    }
    req.logIn(user, function(err) {
      if(err)
        return next(err)

      req.flash('success', { msg: 'Success! You are logged in.' })
      res.redirect(req.session.returnTo || '/')
    })
  })
}

/**
 * GET /account
 * Profile settings page
 */
exports.getAccount = function(req, res) {
  res.render('account/settings', { title: 'Account' })
}