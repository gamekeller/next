(function () {
  function fromNow (date, hidePreposition) {
    var delta = (date - Date.now()) / 1000
    var d = Math.abs(delta)

    var min = 60
    var hour = 60 * 60
    var day = 24 * 60 * 60
    var month = 30 * 24 * 60 * 60
    var year = 365 * 24 * 60 * 60

    var format = fromNow.format
    var range
    var number

    if (d < 45) {
      range = 's'
    } else if (d < 90) {
      range = 'm'
    } else if (d < 45 * min) {
      range = 'mm'
      number = (d % hour) / min
    } else if (d < 90 * min) {
      range = 'h'
    } else if (d < 22 * hour) {
      range = 'hh'
      number = (d % day) / hour
    } else if (d < 36 * hour) {
      range = 'd'
    } else if (d < 25 * day) {
      range = 'dd'
      number = (d % month) / day
    } else if (d < 45 * day) {
      range = 'M'
    } else if (d < 345 * day) {
      range = 'MM'
      number = (d % year) / month
    } else if (d < 545 * day) {
      range = 'y'
    } else {
      range = 'yy'
      number = d / year
    }

    number = number < 2 ? 2 : Math.floor(number)

    return (!hidePreposition ? delta > 0 ? format.future : format.past : '%s').replace('%s', (hidePreposition && format[range].length > 1 ? format[range][1] : format[range][0]).replace('%d', number))
  }

  fromNow.format = {
    future: 'in %s',
    past: 'vor %s',
    s: ['ein paar Sekunden'],
    m: ['einer Minute', 'eine Minute'],
    mm: ['%d Minuten'],
    h: ['einer Stunde', 'eine Stunde'],
    hh: ['%d Stunden'],
    d: ['einem Tag', 'ein Tag'],
    dd: ['%d Tagen', '%d Tage'],
    M: ['einem Monat', 'ein Monat'],
    MM: ['%d Monaten', '%d Monate'],
    y: ['einem Jahr', 'ein Jahr'],
    yy: ['%d Jahren', '%d Jahre']
  }

  window.fromNow = fromNow
})();