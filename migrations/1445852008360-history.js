'use strict'

var _ = require('lodash')
var Promise = require('bluebird')
var mongoose = require('mongoose')
var config = require('../lib/config')
var History = require('../lib/models/History')
var User = require('../lib/models/User')

var connection = new Promise(function(resolve, reject) {
  mongoose.connect('mongodb://' + config.mongo.host + ':' + config.mongo.port + '/' + config.mongo.db)

  mongoose.connection.on('error', function(err) {
    console.error('✗ Unable to connect to MongoDB.')
    reject(err)
  })

  mongoose.connection.on('connected', function() {
    console.log('✔ MongoDB connection established.')
    resolve(mongoose.connection)
  })
})

exports.up = function(next) {
  connection
  .then(function() {
    return User.find({}, 'history', { lean: true })
  })
  .each(function(user) {
    var promises = _.map(user.history, function(history) {
      history.owner = user._id

      var item = new History(history)

      return item.save()
    })

    return Promise.all(promises)
  })
  .then(function() {
    return User.update({}, { $unset: { history: 1 } }, { strict: false, multi: true })
  })
  .then(function() {
    next()
  })
  .catch(function(err) {
    next(err)
  })
}

exports.down = function(next) {
  connection
  .then(function() {
    return History.find({}, '', { lean: true })
  })
  .each(function(history) {
    var owner = history.owner
    delete history.owner
    delete history.__v
    return User.update({ _id: owner }, { $push: { history: history } }, { strict: false })
  })
  .then(function() {
    return new Promise(function(resolve, reject) {
      mongoose.connection.db.dropCollection('history', function(err, result) {
        if(err)
          return reject(err)

        resolve()
      })
    })
  })
  .then(function() {
    next()
  })
  .catch(function(err) {
    next(err)
  })
}