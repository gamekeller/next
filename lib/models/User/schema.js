var utils           = require('../../utils')
var config          = require('../../config')
var mongoose        = require('mongoose')
var validator       = require('validator')
var uniqueValidator = require('mongoose-unique-validator')
var mergePlugin     = require('mongoose-merge-plugin')

/**
 * Create the schema
 */
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: 'Username wird benötigt.',
    unique: true,
    trim: true,
    maxlength: [24, 'Username darf nicht länger als 24 Zeichen sein.']
  },
  rank: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    current: Number,
    total: Number,
    boostMinutesRemaining: {
      type: Number,
      default: 120
    },
    lastPromotionAt: {
      type: Number,
      default: Date.now
    }
  },
  showRankNotice: {
    type: Boolean,
    default: false
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
        validator: utils.buildSchemaValidator('email', function(address) {
          return validator.isEmail(address)
        })
      }
    ]
  },
  avatar: {
    type: {
      type: String,
      default: 'default',
      enum: ['gravatar', 'upload', 'default'],
      mergeable: false
    },
    id: { type: String, mergeable: false },
    defaultId: { type: String, mergeable: false }
  },
  password: {
    type: String,
    required: 'Passwort wird benötigt.',
    log: 'origin',
    validate: [
      {
        msg: 'Passwort muss zwischen vier und 50 Zeichen lang sein.',
        validator: utils.buildSchemaValidator('password', function(password) {
          return validator.isLength(password, 4, 50)
        })
      },
      {
        msg: 'Passwort darf keine Leerzeichen enthalten.',
        validator: utils.buildSchemaValidator('password', function(password) {
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
  teamspeakUid: {
    type: String,
    unique: 'TeamSpeak-ID wird bereits verwendet.',
    sparse: true,
    log: {
      type: 'teamspeakLink',
      action: function(old, fresh) {
        return 'user.teamspeak:' + (fresh ? 'link' : 'unlink' )
      }
    }
  },
  teamspeakOnline: { type: Boolean, default: false, mergeable: false },
  teamspeakTracking: {
    activeTime: { type: Number, mergeable: false },
    onlineTime: { type: Number, mergeable: false },
    lastSeen: { type: Number, mergeable: false }
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
  bio: {
    source: {
      type: String,
      validate: [
        {
          msg: 'Biografie darf nicht nur aus Leerzeichen bestehen.',
          validator: utils.buildSchemaValidator('bio.source', function(bio) {
            if(!bio)
              return true

            return validator.matches(bio, /\S/)
          })
        },
        {
          msg: 'Biografie darf nicht länger als ' + config.profile.bio.maxLength + ' Zeichen sein.',
          validator: utils.buildSchemaValidator('bio.source', function(bio) {
            return validator.isLength(bio, 0, config.profile.bio.maxLength)
          })
        }
      ]
    },
    rendered: { type: String, mergeable: false }
  },
  sessions: [String],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  handle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Handle'
  }
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