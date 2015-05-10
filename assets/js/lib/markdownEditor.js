!function($) {

  var $win = $(window)

  var MarkdownEditor = function(element) {
    var $el           = this.$element = $(element)
    this.$textarea    = $el.find('.markdown-editor-textarea')
    this.$preview     = $el.find('.markdown-editor-preview')
    this.$previewLink = $el.find('[href="#markdown-editor-preview"]')
    this.jqXHR

    this.init()
  }

  MarkdownEditor.GLOBAL_EDITOR_COUNT = 0

  MarkdownEditor.prototype.init = function() {
    this.updateIds()
    this.$previewLink.on('shown.bs.tab', $.proxy(this.initPreview, this))
  }

  MarkdownEditor.prototype.updateIds = function() {
    var count = ++this.constructor.GLOBAL_EDITOR_COUNT
    this.$element.find('[id^="markdown-editor"], [href^="#markdown-editor"]').each(function() {
      var $this = $(this)
      var id    = $this.attr('id')
      var href  = $this.attr('href')

      if(id) $this.attr('id', id + count)
      if(href) $this.attr('href', href + count)
    })
  }

  MarkdownEditor.prototype.initPreview = function() {
    $win.trigger('resize')

    this.$preview.html('Vorschau wird geladen...')

    this.jqXHR = $.ajax('/api/markdown', {
      type: 'POST',
      data: {
        text: this.$textarea.val()
      },
      success: $.proxy(this.handleSuccess, this),
      error: $.proxy(this.handleError, this)
    })
  }

  MarkdownEditor.prototype.handleSuccess = function(data, status) {
    var text = !data ? '<p>Nichts zu rendern.</p>' : data
    this.$preview.html('<div class="markdown-body">' + text + '</div>')
  }

  MarkdownEditor.prototype.handleError = function(ajax, status, error) {
    this.$preview.html('<p><span class="text-danger">Etwas ging schief!</span><br>Error ' + ajax.status + ': ' + ajax.statusText + '</p>')
  }

  $.fn.markdownEditor = function() {
    return this.each(function() {
      var $this = $(this)
      var data  = $this.data('markdownEditor')

      if(!data) {
        data = new MarkdownEditor(this)
        $this.data('markdownEditor', data)
      }
    })
  }
  $.fn.markdownEditor.Constructor = MarkdownEditor

  $('.markdown-editor').markdownEditor()
}($);