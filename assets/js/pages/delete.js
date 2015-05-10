!function($) {
  $('.js-delete-warning, .js-delete-form').toggleClass('hide')

  $('.js-delete-warning').on('closed.bs.alert', function() {
    $('.js-delete-form').removeClass('hide')
  })
}($);