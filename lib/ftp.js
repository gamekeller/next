var config = require('./config')
var FTP = require('ftp')
var ftp = module.exports = new FTP()
var interval

ftp.connect({
  host: config.ftp.host,
  secure: true,
  user: config.ftp.user,
  password: config.ftp.pass
})

ftp.on('ready', function() {
  console.log('✔ FTP connection established.')
  interval = setInterval(function() {
    ftp.status(function() {}) // avoid FTP timeout
  }, 5 * 60 * 1000)
})

ftp.on('error', function(err) {
  console.error('✗ Unable to connect to FTP.', err)
  if(interval) clearInterval(interval)
})