(function () {
  'use strict';

  var allEvents = [];
  var currentYear = 0;
  var currentMonth = 0;
  var _transitioning = false;
  var _navigating = false;

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function fmt12h(t) {
    var parts = t.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }

  function fmtTimeRange(start, end) {
    return end ? fmt12h(start) + ' – ' + fmt12h(end) : fmt12h(start);
  }

  function init() {
    var blob = document.getElementById('events-data');
    if (!blob) return;
    try { allEvents = JSON.parse(blob.textContent); } catch (e) { allEvents = []; }

    var now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    if (allEvents.length > 0) {
      var todayStr = currentYear + '-' + pad(currentMonth + 1) + '-' + pad(now.getDate());
      var upcoming = allEvents.filter(function (e) { return e.date >= todayStr; });
      var target = upcoming.length > 0
        ? upcoming.reduce(function (a, b) { return a.date <= b.date ? a : b; })
        : allEvents.reduce(function (a, b) { return a.date >= b.date ? a : b; });
      var parts = target.date.split('-');
      currentYear  = parseInt(parts[0], 10);
      currentMonth = parseInt(parts[1], 10) - 1;
    }

    document.getElementById('list-view').classList.add('js-hidden');

    document.querySelectorAll('.view-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchView(tab.dataset.view); });
    });
    document.querySelector('.cal-prev').addEventListener('click', function () { navigate(-1); });
    document.querySelector('.cal-next').addEventListener('click', function () { navigate(1); });

    var subscribeButton = document.getElementById('calendar-subscribe');
    if (subscribeButton) {
      subscribeButton.addEventListener('click', function () {
        openSubscribeGuide(subscribeButton);
      });
    }

    renderGrid(currentYear, currentMonth);

    document.querySelectorAll('.event-full-item').forEach(function (el) {
      var start = el.dataset.startTime;
      var end   = el.dataset.endTime;
      if (start) {
        var timeEl = document.createElement('div');
        timeEl.className = 'event-time';
        timeEl.textContent = '🕐 ' + fmtTimeRange(start, end);
        el.querySelector('.event-info').appendChild(timeEl);
      }
      el.addEventListener('click', function () {
        var timeStr = start ? fmtTimeRange(start, end) : '';
        var subtitle = el.dataset.subtitle + (timeStr ? ' · ' + timeStr : '');
        var desc = el.dataset.description;
        var loc  = el.dataset.location;
        var attachments = null;
        if (el.dataset.attachments) {
          try { attachments = JSON.parse(el.dataset.attachments); } catch (e) { attachments = null; }
        }
        var html = [];
        if (desc) html.push('<p>' + esc(desc) + '</p>');
        if (loc)  html.push('<p>📍 ' + esc(loc) + '</p>');
        var attachmentsHtml = renderAttachments(attachments);
        if (attachmentsHtml) html.push(attachmentsHtml);
        NoticeDialog.open(el.dataset.title, subtitle,
          html.length ? html.join('') : '<p><em>No additional details.</em></p>');
      });
    });
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

  }

  function openSubscribeGuide(trigger) {
    NoticeDialog.open(
      'Subscribe to Calendar',
      'Classic Outlook for Windows',
      '<div class="calendar-subscribe-guide">' +
        '<p>Copy this calendar address, then add it as an Internet Calendar in Outlook.</p>' +
        '<div class="calendar-url-row">' +
          '<input type="text" id="calendar-feed-url" class="calendar-feed-url" aria-label="Calendar address" readonly>' +
          '<button type="button" id="calendar-copy-url" class="calendar-copy-btn" data-dialog-autofocus>Copy calendar link</button>' +
        '</div>' +
        '<p id="calendar-copy-status" class="calendar-copy-status" aria-live="polite"></p>' +
        '<ol class="calendar-subscribe-steps">' +
          '<li>In Outlook, select <strong>File &gt; Account Settings &gt; Account Settings</strong>.</li>' +
          '<li>Open the <strong>Internet Calendars</strong> tab and select <strong>New</strong>.</li>' +
          '<li>Paste the copied address, select <strong>Add</strong>, then name and save the calendar.</li>' +
        '</ol>' +
        '<div class="calendar-other-apps">' +
          '<strong>Using another calendar app?</strong>' +
          '<p><a id="calendar-webcal-link" href="">Open calendar app</a></p>' +
        '</div>' +
      '</div>'
    );

    var input = document.getElementById('calendar-feed-url');
    var copyButton = document.getElementById('calendar-copy-url');
    var status = document.getElementById('calendar-copy-status');
    var webcalLink = document.getElementById('calendar-webcal-link');

    input.value = trigger.dataset.calendarUrl;
    webcalLink.href = trigger.dataset.webcalUrl;
    copyButton.addEventListener('click', function () {
      copyCalendarUrl(input, copyButton, status);
    });
  }

  function copyCalendarUrl(input, button, status) {
    function copied() {
      button.textContent = 'Copied';
      status.textContent = 'Calendar link copied to the clipboard.';
    }

    function fallbackCopy() {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      try {
        if (document.execCommand('copy')) {
          copied();
          return;
        }
      } catch (e) {
        // Leave the URL selected so it can still be copied manually.
      }
      status.textContent = 'Copy did not work automatically. Press Ctrl+C to copy the selected link.';
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(input.value).then(copied, fallbackCopy);
      } catch (e) {
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
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
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.addEventListener('click', function () { handleDateClick(cell, dateStr); });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDateClick(cell, dateStr);
        }
      });
    }

    cell.textContent = day;
    return cell;
  }

  function handleDateClick(cell, dateStr) {
    var eventsOnDay = allEvents.filter(function (e) { return e.date === dateStr; });

    document.querySelectorAll('.cal-cell.selected').forEach(function (c) {
      c.classList.remove('selected');
    });
    cell.classList.add('selected');

    if (eventsOnDay.length === 1) {
      var ev = eventsOnDay[0];
      NoticeDialog.open(
        ev.title + (ev.type === 'deadline' ? ' ⚠️' : ''),
        formatDate(dateStr) + (ev.type === 'deadline' ? ' · Deadline' : ' · Event'),
        buildEventHtml(ev)
      );
    } else {
      var html = eventsOnDay.map(function (ev) {
        return '<div class="event-dialog-entry"><strong>' + esc(ev.title) +
               (ev.type === 'deadline' ? ' ⚠️' : '') + '</strong>' +
               buildEventHtml(ev) + '</div>';
      }).join('<hr class="event-dialog-sep">');
      NoticeDialog.open(formatDate(dateStr), eventsOnDay.length + ' events', html);
    }
  }

  function buildEventHtml(ev) {
    var parts = [];
    if (ev.start_time)  parts.push('<p>🕐 ' + esc(fmtTimeRange(ev.start_time, ev.end_time)) + '</p>');
    if (ev.description) parts.push('<p>' + esc(ev.description) + '</p>');
    if (ev.location)    parts.push('<p>📍 ' + esc(ev.location) + '</p>');
    var attachmentsHtml = renderAttachments(ev.attachments);
    if (attachmentsHtml) parts.push(attachmentsHtml);
    return parts.length ? parts.join('') : '<p><em>No additional details.</em></p>';
  }

  function renderAttachments(attachments) {
    if (!attachments || !attachments.length) return '';
    var items = attachments.map(function (a) {
      if (!a || !a.file) return '';
      var url = esc(a.file);
      var fallback = a.file.split('/').pop();
      var label = esc(a.label || fallback);
      return '<li><a href="' + url + '" target="_blank" rel="noopener">📎 ' + label + '</a></li>';
    }).join('');
    return '<ul class="event-attachments">' + items + '</ul>';
  }

  function formatDate(dateStr) {
    var p = dateStr.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function switchView(view) {
    if (_transitioning) return;
    document.querySelectorAll('.view-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.view === view);
    });
    var calView  = document.getElementById('calendar-view');
    var listView = document.getElementById('list-view');
    var outgoing = (view === 'calendar') ? listView : calView;
    var incoming = (view === 'calendar') ? calView  : listView;

    if (outgoing.classList.contains('js-hidden')) return; // already correct view

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      outgoing.classList.add('js-hidden');
      incoming.classList.remove('js-hidden');
      return;
    }

    _transitioning = true;
    outgoing.style.opacity = '0';
    setTimeout(function () {
      outgoing.classList.add('js-hidden');
      outgoing.style.opacity = '';
      incoming.classList.remove('js-hidden');
      incoming.style.opacity = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          incoming.style.opacity = '';
          _transitioning = false;
        });
      });
    }, 120);
  }

  function navigate(delta) {
    if (_navigating) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentMonth += delta;
      if (currentMonth < 0)  { currentMonth = 11; currentYear -= 1; }
      if (currentMonth > 11) { currentMonth = 0;  currentYear += 1; }
      renderGrid(currentYear, currentMonth);
      return;
    }
    var grid  = document.querySelector('.cal-grid');
    var label = document.querySelector('.cal-month-label');
    _navigating = true;
    grid.style.opacity  = '0';
    label.style.opacity = '0';
    setTimeout(function () {
      currentMonth += delta;
      if (currentMonth < 0)  { currentMonth = 11; currentYear -= 1; }
      if (currentMonth > 11) { currentMonth = 0;  currentYear += 1; }
      renderGrid(currentYear, currentMonth);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          grid.style.opacity  = '';
          label.style.opacity = '';
          _navigating = false;
        });
      });
    }, 100);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  document.addEventListener('DOMContentLoaded', init);
})();
