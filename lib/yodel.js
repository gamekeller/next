var _            = require('lodash')
var inherit      = require('soak').inherit
var EventEmitter = require('events').EventEmitter
var dnode        = require('dnode')
var Promise      = require('bluebird')

var Yodel = inherit(EventEmitter, {
  constructor: function Yodel() {
    this.connection = null
    this.status     = null
    this.config     = null
    this.remote     = null
    this.queue      = []

    EventEmitter.call(this)
  },

  connect: function(config) {
    this.config     = this.config || config
    this.status     = Yodel.STATUS_NOCON
    this.connection = dnode.connect(this.config.port)

    _.each(['end', 'error'], function(event) {
      this.connection.on(event, function() {
        this.status = Yodel.STATUS_ERROR
        this.emit.apply(this, [event].concat([].slice.call(arguments)))
        if(this.config.retry) setTimeout(this.connect.bind(this), 5000)
      }.bind(this))
    }, this)

    this.connection.on('remote', function(remote) {
      this.remote = remote
      this.status = Yodel.STATUS_READY
      this.emit('connect')

      while(this.queue.length) {
        var item = this.queue.shift()
        this.exec.apply(this, item.args).then(item.resolve, item.reject)
      }
    }.bind(this))
  },

  exec: function(name, options) {
    return new Promise(function(resolve, reject) {
      if(this.status === Yodel.STATUS_READY)
        if(_.has(this.remote, name))
          this.remote[name].apply(this.remote, options.concat(function(err, data) {
            if(err)
              return reject(err)

            resolve(data)
          }))
        else
          reject(new Error('TeamSpeak RPC does not know "' + name + '"'))
      else if(this.status === Yodel.STATUS_ERROR)
        reject(new Error('Unable to connect to TeamSpeak RPC at localhost:' + this.config.port))
      else
        this.queue.push({ args: [name, options], resolve: resolve, reject: reject })
    }.bind(this))
  }
}, {
  STATUS_NOCON: 0,
  STATUS_ERROR: 1,
  STATUS_READY: 2
})

module.exports = new Yodel()