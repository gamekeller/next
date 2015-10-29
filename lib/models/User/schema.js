var config          = require('../../config')
var crypto          = require('crypto')
var mongoose        = require('mongoose')
var validator       = require('validator')
var uniqueValidator = require('mongoose-unique-validator')
var mergePlugin     = require('mongoose-merge-plugin')

/**
 * Validator helper
 */
function buildValidator(path, fn, async) {
  return function(value, next) {
    if(!this.isModified(path))
      return next()

    if(async)
      fn.apply(this, arguments)
    else
      next(fn.call(this, value))
  }
}

/**
 * Generates the code used by the Teamspeak link wizard
 */
function generateTeamspeakLinkCode() {
  return crypto.randomBytes(20).toString('hex').substr(0, 30)
}

/**
 * Create the schema
 */
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: 'Username wird benötigt.',
    unique: 'Username "{VALUE}" wird bereits verwendet.',
    trim: true,
    validate: [
      {
        msg: 'Username darf kein reserviertes Wort sein.',
        validator: buildValidator('username', function(name) {
          return !validator.isIn(name, config.blacklist.vanity)
        })
      },
      {
        msg: 'Username muss mindestens ein alphanumerisches Zeichen enthalten.',
        validator: buildValidator('username', function(name) {
          return validator.matches(name, /[A-Za-z0-9]/)
        })
      },
      {
        msg: 'Username darf nicht länger als 16 Zeichen sein.',
        validator: buildValidator('username', function(name) {
          return validator.isLength(name, 1, 16)
        })
      },
      {
        msg: 'Username muss dem Muster [A-Za-z0-9_-] folgen.',
        validator: buildValidator('username', function(name) {
          return validator.matches(name, /^[\w-]+$/)
        })
      }
    ]
  },
  email: {
    type: String,
    required: 'E-Mail-Adresse wird benötigt.',
    unique: 'E-Mail-Adresse "{VALUE}" wird bereits verwendet.',
    log: 'change',
    trim: true,
    lowercase: true,
    validate: [
      {
        msg: 'E-Mail-Adresse muss gültig sein.',
        validator: buildValidator('email', function(address) {
          return validator.isEmail(address)
        })
      }
    ]
  },
  gravatarId: { type: String, mergeable: false },
  password: {
    type: String,
    required: 'Passwort wird benötigt.',
    log: 'origin',
    validate: [
      {
        msg: 'Passwort muss zwischen vier und 50 Zeichen lang sein.',
        validator: buildValidator('password', function(password) {
          return validator.isLength(password, 4, 50)
        })
      },
      {
        msg: 'Passwort darf keine Leerzeichen enthalten.',
        validator: buildValidator('password', function(password) {
          return validator.matches(password, /^[^\s]+$/)
        })
      }
    ]
  },
  passwordChangedAt: { type: Number, default: Date.now, mergeable: false },
  admin: { type: Boolean, default: false },
  createdAt: { type: Number, default: Date.now, mergeable: false },
  emailVerified: { type: Boolean, default: false, log: { type: 'origin', action: 'user.verify:email' } },
  emailVerification: {
    code: { type: String, mergeable: false },
    sentAt: { type: Number, mergeable: false },
    resendTries: Number
  },
  forgotPassword: {
    code: { type: String, mergeable: false },
    sentAt: { type: Number, mergeable: false },
    resendTries: Number
  },
  teamspeakUid: { type: String, log: { type: 'teamspeakLink', action: function(old, fresh) { return 'user.teamspeak:' + (fresh ? 'link' : 'unlink' ) } } },
  teamspeakOnline: { type: Boolean, default: false, mergeable: false },
  teamspeakTracking: {
    activeTime: { type: Number, mergeable: false },
    onlineTime: { type: Number, mergeable: false }
  },
  teamspeakConnections: [{
    clientId: { type: Number, mergeable: false },
    nickname: { type: String, mergeable: false },
    connectedAt: { type: Number, mergeable: false },
    currentChannel: {
      name: { type: String, mergeable: false },
      id: { type: Number, mergeable: false }
    }
  }],
  teamspeakLinked: { type: Boolean, default: false, mergeable: false },
  teamspeakLink: {
    code: { type: String, mergeable: false, default: generateTeamspeakLinkCode }
  },
  teamspeakRank: { type: String, mergeable: false },
  bio: {
    source: {
      type: String,
      validate: [
        {
          msg: 'Biografie darf nicht nur aus Leerzeichen bestehen.',
          validator: buildValidator('bio.source', function(bio) {
            if(!bio)
              return true

            return validator.matches(bio, /\S/)
          })
        },
        {
          msg: 'Biografie darf nicht länger als ' + config.profile.bio.maxLength + ' Zeichen sein.',
          validator: buildValidator('bio.source', function(bio) {
            return validator.isLength(bio, 0, config.profile.bio.maxLength)
          })
        }
      ]
    },
    rendered: { type: String, mergeable: false }
  },
  sessions: [String],
  friends: [{
    type: String,
    ref: 'User'
  }]
})

userSchema.post('init', function() {
  this._clean = this.toObject({ getters: true })

  this._clean.get = function(path) {
    var obj    = this
    var pieces = path.split('.')

    for(var i = 0; i < pieces.length; i++) {
      obj = obj == null ? undefined : obj[pieces[i]]
    }

    return obj
  }
})

userSchema.methods.regenerateTeamspeakLinkCode = function() {
  this.teamspeakLink.code = generateTeamspeakLinkCode()
}

userSchema.path('sessions').select(false)
userSchema.path('friends').select(false)

/**
 * Plug in uniqueValidator
 */
userSchema.plugin(uniqueValidator)

/**
 * Plug in mergePlugin
 */
userSchema.plugin(mergePlugin)

/**
 * Export the schema
 */
module.exports = userSchema