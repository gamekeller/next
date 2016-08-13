var _ = require('lodash')
var utils = require('./utils')
var MarkdownIt = require('markdown-it')
var MarkdownItAnchor = require('markdown-it-anchor')

/**
 * Default options for all markdown renderers
 */
var options = exports.options = {
  breaks: true,
  linkify: true
}

/**
 * Plugins
 */
exports.plugins = {}

/**
 * Camo images plugin
 */
exports.plugins.camoImages = function camoImages(md) {
  var defaultRender = md.renderer.rules.image

  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    tokens[idx].attrs[0][1] = utils.convertToCamoUrl(tokens[idx].attrs[0][1])

    return defaultRender(tokens, idx, options, env, self)
  }
}

/**
 * Link class plugin
 */
exports.plugins.linkClass = function linkClass(md) {
  md.core.ruler.push('link_class', function(state) {
    function applyClass(token) {
      if(token.children) _.each(token.children, applyClass)

      if(token.type === 'link_open' && token.attrGet('href')) {
        token.attrSet('class', 'text-link')
      }
    }

    _.each(state.tokens, applyClass)
  })
}

/**
 * Markdown renderer factory
 */
function renderer() {
  return MarkdownIt(options).use(exports.plugins.camoImages)
}

/**
 * Create and export the renderers
 */
var markdowns = exports.markdowns = {
  standard: renderer(),
  anchoredHeadings: renderer().use(exports.plugins.linkClass).use(require('markdown-it-implicit-figures'), { figcaption: true }).use(MarkdownItAnchor, {
    slugify: require('speakingurl'),
    permalink: true,
    permalinkBefore: true,
    permalinkSymbol: '<svg class="header-anchor-icon" viewBox="0 0 16 16"><path d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"/></svg>',
    renderPermalink: function(slug, opts, state, idx) {
      MarkdownItAnchor.defaults.renderPermalink(slug, opts, state, idx)

      state.tokens[idx + 1].children.unshift(
        _.assign(new state.Token('link_open', 'a', 1), {
          attrs: [
            ['class', 'header-anchor-target'],
            ['name', slug]
          ]
        }),
        new state.Token('link_close', 'a', -1)
      )
    },
    callback: function(token) {
      token.attrs.shift()
      token.attrs.push(['class', 'header-anchor-heading'])
    }
  })
}

exports.render = function render(text) {
  return markdowns.standard.render(text)
}

exports.renderWithAnchoredHeadings = function renderWithAnchoredHeadings(text) {
  return markdowns.anchoredHeadings.render(text)
}