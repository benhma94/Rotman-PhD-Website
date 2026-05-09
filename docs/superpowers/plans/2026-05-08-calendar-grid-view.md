# Calendar Grid View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a traditional monthly calendar grid view alongside the existing list view on the Events & Deadlines page, toggled by tab buttons, with a click-to-expand detail panel.

**Architecture:** Jekyll embeds all events as a JSON blob in `events.html`; a new `calendar.js` IIFE reads that data and renders the grid, month navigation, tab toggle, and detail panel entirely client-side. The list view remains visible without JS as a fallback.

**Tech Stack:** Jekyll 4.3, Liquid templates, vanilla JS (ES5-compatible IIFE), vanilla CSS appended to existing `main.css`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `assets/css/main.css` | Modify (append) | All calendar-specific styles |
| `events.html` | Modify | Tab toggle HTML, calendar container, list wrapper, JSON blob, script tag |
| `assets/js/calendar.js` | Create | All calendar behaviour: init, grid render, nav, tab toggle, detail panel |
| `_events/2025-05-11-graduate-scholarship.md` | Create | Test event for May 11 scholarship deadline |

---

## Local dev setup (run once before starting)

```bash
bundle exec jekyll serve --livereload
```

Leave this running. The site rebuilds on file save and reloads at `http://localhost:4000`.

---

## Task 1: Add calendar CSS to main.css

**Files:**
- Modify: `assets/css/main.css` (append to end of file)

- [ ] **Step 1: Append all calendar styles to the end of main.css**

Open `assets/css/main.css` and append this block after the existing `@media (max-width: 768px)` rule:

```css
/* ── View toggle tabs ──────────────────────────── */
.view-tabs {
  display: flex;
  margin-bottom: 1.25rem;
  border: 2px solid var(--navy);
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
}
.view-tab {
  padding: 0.45rem 1.1rem;
  font-family: var(--font);
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--white);
  color: var(--navy);
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.view-tab + .view-tab { border-left: 2px solid var(--navy); }
.view-tab.active { background: var(--navy); color: var(--white); }
.view-tab:hover:not(.active) { background: var(--gray-200); }

/* ── Calendar nav ──────────────────────────────── */
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.cal-prev, .cal-next {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--navy);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  transition: background 0.15s;
}
.cal-prev:hover, .cal-next:hover { background: var(--gray-200); }
.cal-month-label { font-weight: 700; color: var(--navy); font-size: 1rem; }

/* ── Calendar grid ─────────────────────────────── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.75rem;
}
.cal-day-header {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-600);
  text-align: center;
  padding: 0.25rem 0;
}
.cal-cell {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  border-radius: 4px;
  position: relative;
  cursor: default;
  transition: background 0.1s;
}
.cal-cell.other-month { color: var(--gray-200); }
.cal-cell.has-event { cursor: pointer; font-weight: 600; }
.cal-cell.has-event::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--navy);
}
.cal-cell.has-event.deadline::after { background: var(--pink); }
.cal-cell.selected {
  outline: 2px solid var(--orange);
  outline-offset: 1px;
  background: var(--gray-200);
}
.cal-cell.has-event:hover:not(.selected) { background: var(--gray-100); }

/* ── Calendar detail panel ─────────────────────── */
.cal-detail { display: none; margin-top: 0.75rem; }
.cal-detail.visible { display: block; }
.cal-detail-card {
  background: var(--white);
  border-left: 3px solid var(--navy);
  border-radius: 0 6px 6px 0;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.cal-detail-card.deadline { border-left-color: var(--pink); }
.cal-detail-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--navy);
  display: block;
  margin-bottom: 0.2rem;
}
.cal-detail-card.deadline .cal-detail-badge { color: var(--pink); }
.cal-detail-title { font-weight: 600; font-size: 0.95rem; }
.cal-detail-location { font-size: 0.85rem; color: var(--gray-600); margin-top: 0.2rem; }

/* ── JS utility ────────────────────────────────── */
.js-hidden { display: none !important; }
```

- [ ] **Step 2: Verify no existing styles are broken**

Open `http://localhost:4000` in a browser. Check:
- Dashboard page looks identical to before (no style regressions)
- Events page still shows the list view normally
- No console errors

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "feat: add calendar grid CSS styles"
```

---

## Task 2: Restructure events.html

**Files:**
- Modify: `events.html`

- [ ] **Step 1: Replace events.html with the new structure**

Replace the entire contents of `events.html` with:

```html
---
title: Events
---

<div class="page-header">
  <h1>📅 Events & Deadlines</h1>
</div>

<div class="view-tabs">
  <button class="view-tab active" data-view="calendar">📅 Calendar</button>
  <button class="view-tab" data-view="list">☰ List</button>
</div>

<div id="calendar-view">
  <div class="cal-nav">
    <button class="cal-prev">←</button>
    <span class="cal-month-label"></span>
    <button class="cal-next">→</button>
  </div>
  <div class="cal-grid"></div>
  <div class="cal-detail"></div>
</div>

<div id="list-view">
  {% assign sorted_events = site.events | sort: "date" %}
  {% for event in sorted_events %}
  <div class="event-full-item">
    <div class="event-full-badge {% if event.type == 'deadline' %}deadline{% endif %}">
      <div class="badge-day">{{ event.date | date: "%-d" }}</div>
      <div class="badge-month">{{ event.date | date: "%b %Y" }}</div>
    </div>
    <div class="event-info">
      <h3>{{ event.title }}{% if event.type == 'deadline' %} ⚠️{% endif %}</h3>
      {% if event.location %}
      <div class="event-location">📍 {{ event.location }}</div>
      {% endif %}
    </div>
  </div>
  {% endfor %}
</div>

<script type="application/json" id="events-data">
[{% assign sorted_events = site.events | sort: "date" %}{% for event in sorted_events %}{% unless forloop.first %},{% endunless %}{"title":{{ event.title | jsonify }},"date":"{{ event.date | date: "%Y-%m-%d" }}","type":"{{ event.type }}","location":{{ event.location | default: "" | jsonify }}}{% endfor %}]
</script>
<script src="{{ '/assets/js/calendar.js' | relative_url }}"></script>
```

- [ ] **Step 2: Verify static structure before adding JS**

Open `http://localhost:4000/events.html`. Without `calendar.js` existing yet:
- The page header shows "📅 Events & Deadlines"
- Two tab buttons appear (📅 Calendar, ☰ List) — both styled, Calendar tab has navy fill
- The `#calendar-view` section shows the nav arrows and empty div containers
- The `#list-view` section shows the full events list (3 sample events)
- View page source: confirm the `<script id="events-data">` block contains valid JSON with all 3 events in `[{...},{...},{...}]` format

- [ ] **Step 3: Commit**

```bash
git add events.html
git commit -m "feat: add calendar view structure and events JSON blob to events.html"
```

---

## Task 3: Create calendar.js

**Files:**
- Create: `assets/js/calendar.js`

- [ ] **Step 1: Create assets/js/calendar.js with the full module**

```javascript
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
```

- [ ] **Step 2: Verify calendar renders and all interactions work**

Open `http://localhost:4000/events.html`. Check each item:

**Grid rendering:**
- Calendar grid shows the current month with correct day headers (Sun Mon Tue Wed Thu Fri Sat)
- Day numbers are correct and aligned to the right weekday column
- Leading/trailing days from adjacent months appear greyed out
- Dates that have events show a small coloured dot below the number (navy = event, pink = deadline)
- List view is hidden (`.js-hidden` applied)

**Month navigation:**
- Click ← to go to the previous month — grid re-renders, month label updates, detail panel clears
- Click → to go forward — same
- Navigate from January backward → should show December of the previous year
- Navigate from December forward → should show January of the next year

**Tab toggle:**
- Click "☰ List" → list view appears, calendar view hides, List tab has navy fill
- Click "📅 Calendar" → calendar view reappears, Calendar tab has navy fill

**Date click:**
- Click a date that has an event → date gets orange outline, detail card appears below grid
- Detail card shows correct badge (DEADLINE ⚠️ or EVENT), title, and location if present
- Click same date again → detail panel hides, outline clears
- Click a different date with an event → previous selection clears, new detail card appears
- Click a date with no event → nothing happens

**No console errors** — open DevTools and confirm zero errors.

- [ ] **Step 3: Commit**

```bash
git add assets/js/calendar.js
git commit -m "feat: add vanilla JS calendar module with grid, navigation, and detail panel"
```

---

## Task 4: Add test event (Graduate Scholarship deadline)

**Files:**
- Create: `_events/2025-05-11-graduate-scholarship.md`

- [ ] **Step 1: Create the test event file**

```markdown
---
title: "Graduate Scholarship — Internal Deadline"
date: 2025-05-11
type: deadline
---
```

- [ ] **Step 2: Verify the event appears in the calendar**

Jekyll auto-rebuilds (livereload). Open `http://localhost:4000/events.html`:
- Navigate to May 2025 using the ← arrow
- The 11th should have a **pink dot** (deadline type)
- Click the 11th → detail panel shows "DEADLINE ⚠️" badge and title "Graduate Scholarship — Internal Deadline"
- Switch to List view → "Graduate Scholarship — Internal Deadline ⚠️" appears with a pink badge showing "11 / May 2025"

- [ ] **Step 3: Commit**

```bash
git add _events/2025-05-11-graduate-scholarship.md
git commit -m "feat: add graduate scholarship internal deadline test event (May 11)"
```

---

## Done

All four tasks produce a working calendar grid view. To add further events (the real admin workflow): visit `/admin`, authenticate with GitHub, and use the "Events & Deadlines" collection form — no code changes needed.
