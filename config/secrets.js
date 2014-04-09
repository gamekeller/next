module.exports = {
  db: process.env.MONGODB || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/gamekeller',
  sessionSecret: process.env.SESSION_SECRET || 'gkdevel',
  dbOptions: process.env.MONGOOSE_OPTIONS || {}
}