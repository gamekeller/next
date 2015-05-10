!function($, window, document) {
  'use strict';

  var $resendBtn = $('.js-resend-cooldown')

  if($resendBtn.length) {
    setTimeout(function() {
      $resendBtn.replaceWith('<a href="/account/verify/email/resend" class="btn btn-default btn-sm btn-inline">E-Mail erneut senden</a>')
    }, parseInt($resendBtn.data('ready-at'), 10) - Date.now())
  }

}(jQuery, window, document);