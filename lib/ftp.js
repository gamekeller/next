var config = require('./config')
var FTP = require('ftp')
var ftp = module.exports = new FTP()

ftp.connect({
  host: config.ftp.host,
  secure: true,
  user: config.ftp.user,
  password: config.ftp.pass
})

ftp.on('ready', function() {
  console.log('✔ FTP connection established.')
})

ftp.on('error', function(err) {
  console.error('✗ Unable to connect to FTP.', err)
})