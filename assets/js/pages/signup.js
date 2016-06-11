!function($, window, document) {
  'use strict';

  var vanityBlacklist = '"$$ getConfig().blacklist.vanity $$"'.split(',')

  function clearErrors($input) {
    $input
      .siblings('.js-errors')
        .remove()
        .end()
      .closest('.form-group')
        .removeClass('has-error')
  }

  function showErrors($input, errs) {
    clearErrors($input)

    if(!errs.length)
      return

    var $errs = $input.siblings('.js-errors')

    if(!$errs.length) {
      $errs = $('<p class="help-block js-errors"/>').insertAfter($input)
      $input.closest('.form-group').addClass('has-error')
    }

    if(errs.length === 1) {
      $errs.text(errs[0])
    } else {
      $errs = $errs.children('ul')

      if(!$errs.length) {
        $errs = $('<ul/>').appendTo($errs.end())
      }

      $.each(errs, function(i, err) {
        $errs.append('<li>' + err + '</li>')
      })
    }
  }

  function validateField(field, fn) {
    var $field = $(field)
    var val    = $field.val()
    var errs   = []

    if(!val && !$field.data('hadContent'))
      return

    fn.call($field, val, errs)

    if(val)
      $field.data('hadContent', true)

    showErrors($field, errs)
  }

  var $inputs    = $('.js-input')
  var $email     = $('.js-email')
  var $password  = $('.js-password')
  var $confirm   = $('.js-confirm-password')
  var $passwords = $password.add($confirm)

  $('.js-form').on('reset', function() {
    $inputs.each(function() {
      clearErrors($(this).removeData('hadContent'))
    })
    $passwords.attr({
      type: 'password',
      placeholder: '••••••••••••••••••••••••'
    })
    $email.attr('placeholder', 'username@example.com')
  })

  $('.js-username').on('keyup change', function() {
    validateField(this, function(name, errs) {
      $email.attr('placeholder', (name ? name : 'username') + '@example.com')

      if(validator.isIn(name, vanityBlacklist)) {
        errs.push('Username darf kein reserviertes Wort sein.')
        $email.attr('placeholder', 'nope@example.com')
      }
      if(!validator.isLength(name, 1))
        errs.push('Nutzername muss mindestens ein Zeichen lang sein.')
      if(!validator.isLength(name, 0, 16))
        errs.push('Nutzername darf nicht länger als 16 Zeichen sein.')
      if(!validator.matches(name, /^[\w-]+$/))
        errs.push('Nutzername darf nur die Zeichen A-Z, a-z, 0-9, - und _ enthalten.')
    })
  })

  $email.on('keyup change', function() {
    validateField(this, function(email, errs) {
      if(!email.length)
        errs.push('E-Mail-Adresse wird benötigt.')
      if(!validator.isEmail(email))
        errs.push('E-Mail-Adresse muss gültig sein.')
    })
  })

  function confirmPasswordValidator() {
    validateField(this, function(password, errs) {
      if(password !== $password.val())
        errs.push('Passwörter stimmen nicht überein.')
    })
  }

  $password.on('keyup change', function() {
    validateField(this, function(password, errs) {
      if(!validator.isLength(password, 4, 50))
        errs.push('Passwort muss zwischen vier und 50 Zeichen lang sein.')
      if(!validator.matches(password, /^[^\s]+$/))
        errs.push('Passwort darf keine Leerzeichen enthalten.')

      confirmPasswordValidator.call($confirm)
    })
  })

  $('.js-toggle-password')
    .on('change', function() {
      $passwords.attr('type', this.checked ? 'text' : 'password')
      $passwords.attr('placeholder', this.checked ? '!§123$%SuperGeHeim(987/{' : '••••••••••••••••••••••••')
    })
    .closest('.checkbox-inline').removeClass('hide')

  $confirm.on('keyup change', confirmPasswordValidator)

}(jQuery, window, document);