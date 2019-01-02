!function($) {
  $('[href="#profile-bio-edit"]').one('shown.bs.tab', function(e) {
    autosize($($(e.target).attr('href')).find('.markdown-editor-textarea'))
  })
}($);