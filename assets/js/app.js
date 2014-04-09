window.GK = (function($, win, doc) {
  var body    = doc.body
  var exports = {}

  exports.view = _.contains(body.className, 'page-') ? body.className.match(/page-\w+/)[0].replace('page-', '') : null

  return exports
})(jQuery, window, document);