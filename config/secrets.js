module.exports = {
  db: process.env.MONGODB || 'mongodb://localhost:27017/gamekeller',
  sessionSecret: process.env.SESSION_SECRET || 'gkdevel'
}