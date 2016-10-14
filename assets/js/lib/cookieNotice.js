!function($) {
  if (Cookies.get('cookies-accepted')) return

  var $dialog = $(
    '<div class="cookie-notice">' +
      '<p>Wir verwenden Cookies um die bestmögliche Erfahrung auf unserer Website zu ermöglichen. <a href="/cookies">Erfahre mehr</a></p>' +
    '</div>'
  ).appendTo(document.body)

  $('<button type="button" class="btn btn-primary btn-block">Alles klar!</button>').appendTo($dialog).one('click', function () {
    Cookies.set('cookies-accepted', 1, { expires: 365 })
    $dialog.remove()
  })
}($);