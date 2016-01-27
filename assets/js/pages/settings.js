!function($, window, document) {
  'use strict';

  var $resendBtn = $('.js-resend-cooldown')

  if($resendBtn.length) {
    setTimeout(function() {
      $resendBtn.replaceWith('<button type="submit" formaction="/account/verify/email/resend" class="btn btn-default btn-xs btn-inline">E-Mail erneut senden</a>')
    }, parseInt($resendBtn.data('ready-at'), 10) - Date.now())
  }

}(jQuery, window, document);