//= require bower/lodash/dist/lodash.js
//= require bower/jquery/dist/jquery.js
//= require bower/bootstrap/dist/js/bootstrap.js
//= require js/app.js

(function($, GK, win, doc) {

  // --- Account settings ---
  if(GK.view === 'settings') {
    var $confirm = $('.js-confirm-password').closest('.form-group')

    $('.js-password').on('change keyup', function() {
      $confirm[($(this).val() ? 'remove' : 'add') + 'Class']('hidden')
    })
  }

})(jQuery, GK, window, document);