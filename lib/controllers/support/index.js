var _       = require('lodash')
var Promise = require('bluebird')
var router  = require('express').Router()
var User    = require('../../models/User')
var SupportArticle = require('../../models/Post/SupportArticle')

/*+
 * Get team members and set env up
 */
router.use(function(req, res, next) {
  res.locals.customCss = 'support'

  User.find({ rank: { $gte: 9800 } }, 'username rank avatar teamspeakLinked teamspeakUid', { sort: { rank: -1 } })
  .then(function(team) {
    res.locals.team = team.sort(function(a, b) {
      if (a.teamspeakOnline !== b.teamspeakOnline) return a.teamspeakOnline ? -1 : 0

      var d = b.rank - a.rank

      if (d !== 0) return d

      return a.username.localeCompare(b.username)
    })
  })
  .then(next)
})

/**
 * GET /support
 * Display support index page
 */
router.get('/', function(req, res, next) {
  // Promise.join(
  //   SupportArticle.find({ 'showcase.active': true }).sort({ order: -1 }).limit(3),
  //   SupportArticle.aggregate().sort({ order: -1 }).group({ _id: '$category', articles: { $push: '$$ROOT' } }),
  //   function(showcaseArticles, articles) {
  //     res.render('support/index', {
  //       title: 'Support',
  //       team: res.locals.team,
  //       showcaseArticles: showcaseArticles,
  //       articlesByCategory: articles
  //     })
  //   }
  // )

  SupportArticle.find().sort({ 'showcase.active': -1, order: -1 }).then(function(articles) {
    res.render('support/index', {
      title: 'Support',
      showcaseArticles: _(articles).filter({ showcase: { active: true } }).take(3).value(),
      articlesByCategory: _(articles).groupBy('category').omit('undefined').value()
    })
  })
})

/**
 * Get article by slug
 */
router.param('slug', function(req, res, next, slug) {
  if(!/[\w-]+/.test(slug))
    return next('route')

  SupportArticle.findOne({ slug: slug }).then(function(article) {
    if(!article)
      return next('route')

    res.locals.article = article

    next()
  }).catch(next)
})

/**
 * GET /support/:slug
 * Display knowledgebase article
 */
router.get('/:slug', function(req, res, next) {
  res.render('support/article', {
    title: res.locals.article.title + ' · Support'
  })
})

/**
 * Get categories
 */
router.param('category', function(req, res, next, category) {
  SupportArticle.find({ categorySlug: category }).then(function(articles) {
    if(!articles.length)
      return next('route')

    res.locals.articles = articles

    next()
  }).catch(next)
})

/**
 * GET /support/:slug
 * Display knowledgebase article
 */
router.get('/:category', function(req, res, next) {
  res.render('support/category', {
    title: res.locals.articles[0].category + ' · Support'
  })
})

/**
 * Export the router
 */
module.exports = router