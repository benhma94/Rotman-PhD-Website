(function () {
  'use strict';

  var allEvents = [];
  var currentYear = 0;
  var currentMonth = 0;

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function init() {
    var blob = document.getElementById('events-data');
    if (!blob) return;
    try { allEvents = JSON.parse(blob.textContent); } catch (e) { allEvents = []; }

    var now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    document.getElementById('list-view').classList.add('js-hidden');

    document.querySelectorAll('.view-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });
    document.querySelector('.cal-prev').addEventListener('click', function () { navigate(-1); });
    document.querySelector('.cal-next').addEventListener('click', function () { navigate(1); });

    renderGrid(currentYear, currentMonth);
  }

  function renderGrid(year, month) {
    currentYear = year;
    currentMonth = month;

    document.querySelector('.cal-month-label').textContent = MONTHS[month] + ' ' + year;

    var grid = document.querySelector('.cal-grid');
    grid.innerHTML = '';

    DAYS.forEach(function (d) {
      var h = document.createElement('div');
      h.className = 'cal-day-header';
      h.textContent = d;
      grid.appendChild(h);
    });

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrev = new Date(year, month, 0).getDate();

    for (var i = firstDay - 1; i >= 0; i--) {
      grid.appendChild(makeCell(year, month - 1, daysInPrev - i, true));
    }
    for (var d = 1; d <= daysInMonth; d++) {
      grid.appendChild(makeCell(year, month, d, false));
    }
    var trailing = (firstDay + daysInMonth) % 7;
    if (trailing > 0) {
      for (var t = 1; t <= 7 - trailing; t++) {
        grid.appendChild(makeCell(year, month + 1, t, true));
      }
    }

    var detail = document.querySelector('.cal-detail');
    detail.classList.remove('visible');
    detail.innerHTML = '';
  }

  function makeCell(year, month, day, otherMonth) {
    var actual = new Date(year, month, day);
    var dateStr = actual.getFullYear() + '-' + pad(actual.getMonth() + 1) + '-' + pad(actual.getDate());
    var eventsOnDay = allEvents.filter(function (e) { return e.date === dateStr; });

    var cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (otherMonth) cell.classList.add('other-month');

    if (eventsOnDay.length > 0) {
      cell.classList.add('has-event');
      var allDeadlines = eventsOnDay.every(function (e) { return e.type === 'deadline'; });
      if (allDeadlines) cell.classList.add('deadline');
      cell.dataset.date = dateStr;
      cell.addEventListener('click', function () { handleDateClick(cell, dateStr); });
    }

    cell.textContent = day;
    return cell;
  }

  function handleDateClick(cell, dateStr) {
    var eventsOnDay = allEvents.filter(function (e) { return e.date === dateStr; });
    var wasSelected = cell.classList.contains('selected');

    document.querySelectorAll('.cal-cell.selected').forEach(function (c) {
      c.classList.remove('selected');
    });

    if (wasSelected) {
      var detail = document.querySelector('.cal-detail');
      detail.classList.remove('visible');
      detail.innerHTML = '';
    } else {
      cell.classList.add('selected');
      showDetail(eventsOnDay);
    }
  }

  function showDetail(events) {
    var detail = document.querySelector('.cal-detail');
    detail.innerHTML = '';

    events.forEach(function (ev) {
      var card = document.createElement('div');
      card.className = 'cal-detail-card' + (ev.type === 'deadline' ? ' deadline' : '');

      var badge = document.createElement('span');
      badge.className = 'cal-detail-badge';
      badge.textContent = ev.type === 'deadline' ? 'DEADLINE ⚠️' : 'EVENT';

      var title = document.createElement('div');
      title.className = 'cal-detail-title';
      title.textContent = ev.title;

      card.appendChild(badge);
      card.appendChild(title);

      if (ev.location) {
        var loc = document.createElement('div');
        loc.className = 'cal-detail-location';
        loc.textContent = '📍 ' + ev.location;
        card.appendChild(loc);
      }

      detail.appendChild(card);
    });

    detail.classList.add('visible');
  }

  function switchView(view) {
    document.querySelectorAll('.view-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.view === view);
    });
    if (view === 'calendar') {
      document.getElementById('calendar-view').classList.remove('js-hidden');
      document.getElementById('list-view').classList.add('js-hidden');
    } else {
      document.getElementById('calendar-view').classList.add('js-hidden');
      document.getElementById('list-view').classList.remove('js-hidden');
    }
  }

  function navigate(delta) {
    currentMonth += delta;
    if (currentMonth < 0)  { currentMonth = 11; currentYear -= 1; }
    if (currentMonth > 11) { currentMonth = 0;  currentYear += 1; }
    renderGrid(currentYear, currentMonth);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  document.addEventListener('DOMContentLoaded', init);
})();
