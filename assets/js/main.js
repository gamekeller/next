//= require bower/jquery/dist/jquery.js
//= require bower/Stickyfill/dist/stickyfill.js
//= require bower/autofill-event/src/autofill-event.js
//= require bower/validator-js/validator.js
//= require bower/moment/moment.js
//= require bower/moment/locale/de.js
//= require bower/bootstrap/js/transition.js
//= require bower/bootstrap/js/alert.js
//= require bower/bootstrap/js/collapse.js
//= require bower/bootstrap/js/dropdown.js
//= require bower/bootstrap/js/tooltip.js
//= require bower/bootstrap/js/tab.js
//= require bower/ExpandingTextareas/expanding.js
//= require js/lib/markdownEditor.js

!function($) {
  function checkPopulation($element) {
    $element.closest('.floating-label').toggleClass('floating-label-populated', !!$element.val())
  }

  $(document)
    .on('focus blur change', '.floating-label > .form-control', function(e) {
      checkPopulation($(this).closest('.floating-label').toggleClass('floating-label-active', /^(focus|focusin)$/.test(e.type)).end())
    })
    .on('reset', 'form', function() {
      var $form = $(this)

      setTimeout(function() {
        $form.find('.floating-label-populated > input').each(function() {
          checkPopulation($(this))
        })
      }, 0)
    })

  $('.floating-label > .form-control').each(function() {
    var $this = $(this)

    $this.attr('placeholder', $this.attr('data-placeholder'))

    checkPopulation($this)
  })
}($);

!function($, moment) {
  var $timestamps = $('.js-timestamp')

  function updateTimestamps() {
    $timestamps.each(function() {
      var $this = $(this)
      $this.text(moment(parseInt($this.attr('data-unix'), 10)).fromNow($this.attr('data-suffix') === 'false'))
    })
  }

  updateTimestamps()
  setInterval(updateTimestamps, 60000)
}($, moment);


!function($) {
  var $win = $(window)

  $('.js-expander-scope').each(function() {
    var $this   = $(this)
    var $target = $this.find('.js-expander-target').eq(0)
    var $toggle = $this.find('.js-expander-toggle').eq(0)

    $toggle.on('click keydown', function(e) {
      if(e.type === 'keydown' && !/32|13/.test(e.which)) return
      e.preventDefault()
      $target.add($toggle).toggleClass('active')
      Stickyfill.rebuild()
    })
  })
}($);

!function($) {
  $(document)
    .on('click', '.js-copy-field', function(e) {
      e.preventDefault()
      $(this).trigger('select')
    })
    .on('mousedown', '.js-copy-field', function(e) { e.preventDefault() })
}($);

!function($) {
  $('.js-confirm').each(function() {
    var $this = $(this)

    $this.on($this.data('confirm-event') || 'click', function(e) {
      if(!confirm($this.data('confirm-text'))) e.preventDefault()
    })
  })
}($);

!function($) {
  $('.js-sticky').Stickyfill()
  $('.js-tooltip').tooltip()
  $('.js-autosize').expanding()
}($);