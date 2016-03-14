var userSchema = require('./schema')

/**
 * Mount middleware
 */
require('./middleware/password')(userSchema)
require('./middleware/bio')(userSchema)
require('./middleware/teamspeak')(userSchema)
require('../Handle/middleware')(userSchema, 'user', 'username', 'Username')

require('./middleware/avatar')(userSchema)

/**
 * Add methods
 */
require('./methods/comparePassword')(userSchema)
require('./methods/avatarUrl')(userSchema)
require('./methods/sendEmailVerification')(userSchema)
require('./methods/sendPasswordReset')(userSchema)
require('./methods/getSessions')(userSchema)
require('./methods/log')(userSchema)
require('./methods/saveAndLogChanges')(userSchema)
require('./methods/friendsWith')(userSchema)
require('./methods/rank')(userSchema)
require('./methods/destroySessions')(userSchema)
require('./methods/initAvatar')(userSchema)

/**
 * Make into model and export
 */
module.exports = require('mongoose').model('User', userSchema)