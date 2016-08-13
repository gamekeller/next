var Promise = require('bluebird')
var _       = require('lodash')
var router  = require('express').Router()
var utils   = require('../../utils')
var SupportArticle = require('../../models/Post/SupportArticle')

function createOrUpdateArticle(data, passedArticle) {
  var article = passedArticle || new SupportArticle()

  _.merge(article, {
    title: data.title,
    slug: data.slug,
    order: data.order,
    text: {
      source: data.text.source
    }
  })

  if(data.category) {
    article.category = data.category
  } else if(article.category) {
    article.category = undefined
  }

  article.showcase = {
    active: data.showcase.active === 'on' ? true : false
  }

  if(data.showcase.title) article.showcase.title = data.showcase.title
  if(data.showcase.guide === 'on') article.showcase.guide = true

  return article
}

/**
 * GET /admin/kb
 * Manage knowledgebase articles
 */
router.get('/', function(req, res, next) {
  SupportArticle.find().then(function(articles) {
    res.render('admin/kb/index', {
      title: 'Knowledgebase verwalten',
      articles: articles
    })
  }).catch(next)
})

/**
 * GET /admin/kb/new
 * New support article form
 */
router.get('/new', function(req, res, next) {
  res.render('admin/kb/form', {
    title: 'Neuen Knowledgebase Eintrag erstellen'
  })
})

/**
 * POST /admin/kb/new
 * Create new support article
 */
router.post('/new', function(req, res, next) {
  req.assert('article[title]', 'Titel darf nicht leer sein').notEmpty()
  req.assert('article[slug]', 'URL-Slug darf nicht leer sein').notEmpty()
  req.assert('article[order]', 'Order-Wert darf nicht leer sein').notEmpty()
  req.assert('article[text]', 'Inhalt darf nicht leer sein').notEmpty()

  var errors = req.validationErrors()

  if(errors)
    return res.returnWith('error', errors)

  var article = createOrUpdateArticle(req.body.article)

  article.save().then(function() {
    res.returnWith('success', 'Eintrag wurde erfolgreich erstellt.', req.resolveUrl('../' + article.id))
  }).catch(function(err) {
    return res.handleMongooseError(err, next)
  })
})

/**
 * Get article by ID
 */
router.param('articleid', function(req, res, next, id) {
  if(!utils.isValidObjectId(id))
    return next('route')

  SupportArticle.findById(id).then(function(article) {
    if(!article)
      return next('route')

    res.locals.article = article

    next()
  }).catch(next)
})

/**
 * GET /admin/kb/:articleid
 * Edit support article form
 */
router.get('/:articleid', function(req, res, next) {
  res.render('admin/kb/form', {
    title: 'Knowledgebase-Eintrag bearbeiten'
  })
})

/**
 * POST /admin/kb/:articleid
 * Update support article
 */
router.post('/:articleid', function(req, res, next) {
  createOrUpdateArticle(req.body.article, res.locals.article).save().then(function() {
    res.returnWith('success', 'Eintrag wurde erfolgreich bearbeitet.')
  }).catch(function(err) {
    return res.handleMongooseError(err, next)
  })
})

/**
 * POST /admin/kb/:articleid/delete
 * Delete support article
 */
router.post('/:articleid/delete', function(req, res, next) {
  res.locals.article.remove().then(function() {
    res.returnWith('success', 'Eintrag wurde gelöscht.', req.resolveUrl('../../'))
  }).catch(function(err) {
    return res.handleMongooseError(err, next)
  })
})

/**
 * Export the router
 */
module.exports = router