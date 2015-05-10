var _          = require('lodash-node')
var Promise    = require('bluebird')
var teamspeak  = require('./client')
var User       = require('../models/User')
var redis      = require('../redis')
var cluidCache = {}
var interval   = 0
var hashFields = ['nickname', 'channelId', 'channelName', 'connectedAt']

if(!teamspeak.connection)
  return redis.$.multi([['set', 'tsStatus', 'ERR'], ['del', 'tsOnline']]).exec()

function updateMeta(clid) {
  if(clid)
    teamspeak.findByClid(clid).then(function(client) {
      redis.$.hset('ts:' + client.client_unique_identifier, 'nickname' + clid, client.client_nickname)
    })
  else
    teamspeak.getOnlineClients().then(function(clients) {
      clients = _.map(clients, function(client) {
        return ['hmset', 'ts:' + client.client_unique_identifier, 'nickname' + client.clid, client.client_nickname, 'ranks', '' + client.client_servergroups]
      })

      redis.$.multi(clients).exec()
    })
}

function updateCurrentChannel(clid, cid) {
  teamspeak.getChannelInfo(cid).then(function(channel) {
    redis.$.hmset('ts:' + cluidCache[clid], 'channelId' + clid, cid, 'channelName' + clid, sanitizeChannelName(channel.channel_name))
  })
}

function sanitizeChannelName(name) {
  return name.replace(/\[spacer[0-9]*\]/, '')
}

function updateConnectedAt(clid) {
  teamspeak.findByClid(clid).then(function(info) {
    redis.$.hset('ts:' + cluidCache[clid], 'connectedAt' + clid, Date.now() - info.connection_connected_time)
  })
}

function clientEnter(clid, cluid, cid) {
  cluidCache[clid] = cluid

  Promise.join(teamspeak.getChannelInfo(cid), teamspeak.findByClid(clid), function(channel, client) {
    var data                   = {}
    data['channelId' + clid]   = cid
    data['channelName' + clid] = sanitizeChannelName(channel.channel_name)
    data['connectedAt' + clid] = Date.now() - client.connection_connected_time
    data['nickname' + clid]    = client.client_nickname

    redis.$.multi()
      .sadd('tsOnline', cluid)
      .hmset('ts:' + cluid, data)
      .exec()
  })
}

teamspeak.on('connect', function() {
  teamspeak.getOnlineClients().then(function(clients) {
    var commands = [
      ['set', 'tsStatus', 'OK'],
      ['del', 'tsOnline']
    ]

    _.each(clients, function(client) {
      var cluid = cluidCache[client.clid] = client.client_unique_identifier

      updateCurrentChannel(client.clid, client.cid)
      updateConnectedAt(client.clid)

      commands.push(
        ['sadd', 'tsOnline', cluid],
        ['del', 'ts:' + cluid]
      )
    })

    redis.$.multi(commands).exec()
  })

  if(interval)
    clearInterval(interval)

  interval = setInterval(updateMeta, 5000)
  updateMeta()
})

teamspeak.on('error', function() {
  if(interval)
    interval = clearInterval(interval)

  redis.$.set('tsStatus', 'ERR')
})

teamspeak.on('cliententerview', function(client) {
  clientEnter(client.clid, client.client_unique_identifier, client.ctid)
})

teamspeak.on('clientleftview', function(client) {
  var clid  = client.clid
  var cluid = cluidCache[clid]

  redis.$.hdel(['ts:' + cluid].concat(_.map(hashFields, function(field) { return field + clid })), function(err) {
    if(err) console.error(err)
  })

  teamspeak.send('clientgetids', { cluid: cluid }).catch(function(err) {
    if(err.id === 1281) redis.$.srem('tsOnline', cluid)
    else console.error(err)
  })
})

teamspeak.on('clientmoved', function(info) {
  updateCurrentChannel(info.clid, info.ctid)
})

teamspeak.on('channeledited', function(info) {
  teamspeak.getOnlineClients().then(function(clients) {
    clients = _(clients)
      .filter({ cid: info.cid })
      .map(function(client) {
        return ['hmset', 'ts:' + client.client_unique_identifier, 'channelId' + client.clid, info.cid, 'channelName' + client.clid, info.channel_name]
      })
      .value()

    redis.$.multi(clients).exec()
  })
})