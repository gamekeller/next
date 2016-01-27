var multer = require('multer')
var FTP    = require('multer-ftp')
var Tokens = require('csrf')
var csrf   = require('csurf')
var gm     = require('gm')
var path   = require('path')
var util   = require('../../utils')
var config = require('../../config')
var auth   = require('../../auth')
var ftp    = require('../../ftp')

var tokens = new Tokens()

var upload = multer({
  storage: new FTP({
    basepath: config.avatarsPath,
    connection: ftp,
    transformFile: function(req, file, cb) {
      file.originalname = file.originalname.substr(0, file.originalname.lastIndexOf('.')) + '.jpg'

      var modifiedStream = gm(file.stream, file.originalname)
      .resize(512, 512)
      .background('#ffffff')
      .gravity('Center')
      .extent(512, 512)
      .quality(92)
      .noProfile()
      .stream('jpg')

      cb(null, modifiedStream)
    }
  }),
  fileFilter: function(req, file, callback) {
    if(tokens.verify(req.session.csrfSecret, req.body._csrf)) {
      if(/\.(jpg|jpeg|png)$/.test(file.originalname)) {
        callback(null, true)
      } else {
        req.gkFileNotAnImage = true
        callback(null, false)
      }
    } else {
      var err = new Error()
      err.code = 'EBADCSRFTOKEN'
      callback(err)
    }
  },
  limits: {
    fields: 1,
    fileSize: 2 * 1000000, // bytes
    headerPairs: 1,
    parts: 2,
    files: 1
  }
})

function deleteAvatar(id, cb) {
  ftp.delete(config.avatarsPath + '/' + id, function(err) {
    if(err)
      console.error(err)

    cb()
  })
}

exports.upload = function(app) {
  /**
   * POST /account/avatar/upload
   * Update avatar
   */
  app.post('/account/avatar/upload', auth.ensureAuthenticated, upload.single('avatar'), csrf(), function(req, res, next) {
    if(req.gkFileNotAnImage)
      return res.returnWith('error', 'Die ausgewählte Datei ist kein Bild oder in einem falschen Format.', '/account')
    if(!req.file)
      return res.returnWith('error', 'Du hast keine Datei ausgewählt.', '/account')

    var user = req.user

    function change() {
      var id = path.basename(req.file.path)
      user.avatar.id = id
      user.avatar.type = 'upload'

      user.save().then(function() {
        res.returnWith('success', 'Dein Avatar wurde geändert.', '/account')
      })
    }

    if(user.avatar.type === 'upload') {
      deleteAvatar(user.avatar.id, change)
    } else {
      change()
    }
  })
}

var router = exports.router = require('express').Router()

/**
 * POST /account/avatar/delete
 * Delete avatar and fall back to default one
 */
router.post('/delete', function(req, res, next) {
  var user = req.user

  function change() {
    user.avatar.type = 'default'
    user.avatar.id = undefined

    user.save().then(function() {
      res.returnWith('success', 'Dein Avatar wurde gelöscht.', '/account')
    })
  }

  if(user.avatar.type === 'upload') {
    deleteAvatar(user.avatar.id, change)
  } else {
    change()
  }
})

/**
 * POST /account/avatar/gravatar
 * Use gravatar as avatar
 */
router.post('/gravatar', function(req, res, next) {
  var user = req.user

  function change() {
    user.avatar.type = 'gravatar'
    user.avatar.id = util.md5(user.email)

    user.save().then(function() {
      res.returnWith('success', 'Dein Gravatar wird nun verwendet.', '/account')
    })
  }

  if(user.avatar.type === 'upload') {
    deleteAvatar(user.avatar.id, change)
  } else {
    change()
  }
})