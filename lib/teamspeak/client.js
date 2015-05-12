var _               = require('lodash')
var inherit         = require('soak').inherit
var EventEmitter    = require('events').EventEmitter
var TeamSpeakClient = require('node-teamspeak')
var Promise         = require('bluebird')

var Client = inherit(EventEmitter, {
  constructor: function Client() {
    this.connection = null
    this.status     = null
    this.queue      = []

    EventEmitter.call(this)
  },

  connect: function(config) {
    this.config     = this.config || config
    this.status     = Client.STATUS_NOCON
    this.connection = new TeamSpeakClient(this.config.host)

    this.connection.on('error', function() {
      this.emit('error')
      this.status = Client.STATUS_ERROR
      if(this.config.retry) setTimeout(this.connect.bind(this), 5000)
    }.bind(this))

    this.connection.on('connect', function() {
      this.send('login', { client_login_name: this.config.auth.user, client_login_password: this.config.auth.pass }, true)
      .then(this.send('use', { sid: this.config.sid }, true))
      .then(this.send('servernotifyregister', { event: 'channel', id: 0 }, true))
      .then(function() {
        this.emit('connect')
        this.status = Client.STATUS_READY

        // Relay events
        _.each(['cliententerview', 'clientleftview', 'clientmoved', 'channeledited'], function(e) {
          this.connection.on(e, function() {
            this.emit.apply(this, [e].concat([].slice.call(arguments)))
          }.bind(this))
        }, this)

        while(this.queue.length) {
          var item = this.queue.shift()
          this.send.apply(this, item.args).then(item.resolve, item.reject)
        }
      }.bind(this))
    }.bind(this))
  },

  send: function(command, options, force) {
    var args = Array.prototype.slice.call(arguments)

    return new Promise(function(resolve, reject) {
      if(force || this.status === Client.STATUS_READY)
        this.connection.send(command, options, function(err, res, raw) {
          if(err.id !== 0 && err.msg !== 'ok')
            return reject(err)

          if(res || raw)
            resolve(res || raw)
          else if(err.id === 0 && err.msg === 'ok')
            resolve(null)
          else
            reject(null)
        })
      else if(this.status === Client.STATUS_ERROR)
        reject(new Error('Unable to connect to TeamSpeak Server Query at ' + this.config.host + ':10011'))
      else
        this.queue.push({ args: args, resolve: resolve, reject: reject })
    }.bind(this))
  },

  getOnlineClients: function() {
    return this.send('clientlist', { '-uid': true, '-groups': true }).then(function(list) {
      return _.filter(_.isArray(list) ? list : [list], function(client) {
        return client.client_type === 0
      })
    })
  },

  getChannelInfo: function(ctid) {
    return this.send('channelinfo', { cid: ctid })
  },

  isConnected: function(cluid) {
    return this.send('clientgetids', { cluid: cluid }).then(function(ids) {
      return this.send('clientinfo', { clid: ids.clid }).then(function(client) {
        return Promise.resolve(client.client_type === 0)
      })
    }.bind(this), function(err) {
      if(err.id === 1281 && err.msg === 'database empty result set')
        return Promise.resolve(false)
      else
        return Promise.reject(err)
    })
  },

  findByClid: function(clid) {
    return this.send('clientinfo', { clid: clid })
  },

  findByNickname: function(nickname) {
    return this.send('clientfind', { pattern: nickname }).then(function(client) {
      return this.findByClid(client.clid)
    }.bind(this))
  }
}, {
  STATUS_NOCON: 0,
  STATUS_ERROR: 1,
  STATUS_READY: 2
})

module.exports = new Client()