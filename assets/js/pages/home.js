!function($) {
  var ranks = '"$$ getConfig().teamspeak.rankImages $$"'.split(',')
  var paths = '"$$ getConfig().teamspeak.rankImages.map(function(img) { return asset_path("img/ranks/" + img + ".png") }) $$"'.split(',')

  function loadContent($target, $loading, $error, $info) {
    $target
      .empty()
      .add($info)
      .add($error)
      .addClass('hide')

    $loading.removeClass('hide')

    $.ajax('//www.reddit.com/r/gamekeller/new.json?limit=3', {
      cache: false
    })
      .done(function(res) {
        $.each(res.data.children, function(i) {
          var data = this.data
          var rank = data.author_flair_text && data.author_flair_text.toLowerCase()
          var hasRank = data.author_flair_text && ranks.indexOf(rank) !== -1

          $('<li class="panel-list-item">' +
            (data.link_flair_text ? '<span class="label label-primary">' + data.link_flair_text + '</span> ' : '') +
            '<a href="' + data.url + '" class="reddit-title" ' +
            'title="' + (data.link_flair_text ? '[' + data.link_flair_text + '] ' : '') + data.title +
            '">' + data.title + '</a>' +
            ' von ' +
            (hasRank ? '<img class="img-flair" src="' + paths[ranks.indexOf(rank)] + '" title="' + data.author_flair_text + '"> ' : '')
            + data.author +
            '</li>').appendTo($target)
        })

        $target.add($info).removeClass('hide')
      })
      .fail(function() {
        $error.removeClass('hide')
      })
      .always(function() {
        $loading.addClass('hide')
      })
  }

  $('.js-reddit').each(function() {
    var $this = $(this)

    $this.find('.js-reddit-reload').on('click', function(e) {
      e.preventDefault()
      loadContent($this.find('.js-reddit-target'), $this.find('.js-reddit-loading'), $this.find('.js-reddit-error'), $this.find('.js-reddit-info'))
    }).trigger('click')
  })
}($);