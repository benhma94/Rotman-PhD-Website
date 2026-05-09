# Calendar Grid View — Design Spec

**Date:** 2026-05-08
**Status:** Approved

## Goal

Add a traditional monthly calendar grid view to the Events & Deadlines page alongside the existing list view. Users toggle between views via tab buttons. Clicking a date with events reveals a detail panel below the grid. No new dependencies; no changes to Decap CMS or `_events/` files.

---

## Architecture

Jekyll renders `events.html` and injects all events as an embedded JSON blob inside a `<script type="application/json">` tag. A new vanilla JS module (`assets/js/calendar.js`) reads that data on page load and owns all calendar behaviour. The existing list HTML stays in place; the module shows or hides it based on the active tab.

**Data flow:**
```
_events/*.md  →  Jekyll build  →  events.html (JSON blob + calendar container)
                                        ↓
                              assets/js/calendar.js
                          (reads JSON, renders grid, handles interactions)
```

---

## Files Changed

| File | Change |
|------|--------|
| `events.html` | Add JSON blob, tab toggle markup, calendar container div; wrap existing list in a container div; add `<script src>` for calendar.js |
| `assets/js/calendar.js` | New file — self-contained calendar module (~150 lines) |
| `assets/css/main.css` | Append ~60 lines of calendar-specific styles |

No changes to `_config.yml`, `admin/`, `_events/`, or any other file.

---

## Data Model

Jekyll outputs events as a JSON array embedded in the page:

```html
<script type="application/json" id="events-data">
  [
    { "title": "Graduate Scholarship — Internal Deadline", "date": "2025-05-11", "type": "deadline", "location": "" },
    { "title": "Fall Welcome Reception", "date": "2025-09-12", "type": "event", "location": "Rotman Atrium, 105 St George St" }
  ]
</script>
```

Fields used: `title` (string), `date` (YYYY-MM-DD string), `type` (`"event"` | `"deadline"`), `location` (string, may be empty). These match existing front matter exactly — no new CMS fields needed.

---

## UI Structure (events.html after changes)

```
.page-header          (existing — unchanged)
.view-tabs            (new)
  .view-tab[data-view="calendar"]   "📅 Calendar"  ← default active
  .view-tab[data-view="list"]       "☰ List"

#calendar-view        (new, shown by default)
  .cal-nav
    button.cal-prev   "←"
    .cal-month-label  "May 2025"
    button.cal-next   "→"
  .cal-grid
    .cal-day-header × 7   (Sun … Sat)
    .cal-cell × N         (day number cells)
  .cal-detail           (hidden until a date is clicked)

#list-view            (existing list, hidden by default)
  (existing .event-full-item loop — unchanged)

<script type="application/json" id="events-data"> … </script>
<script src="/assets/js/calendar.js"></script>
```

---

## JavaScript Module (calendar.js)

Self-contained IIFE with no external dependencies. Public surface is zero — it auto-initialises on `DOMContentLoaded`.

**Functions:**

| Function | Responsibility |
|----------|----------------|
| `init()` | Parse JSON blob, attach tab + nav listeners, render current month |
| `renderGrid(year, month)` | Build `.cal-grid` DOM: day headers + day cells; mark cells that have events with a coloured dot; update `.cal-month-label` |
| `handleDateClick(cell, dateStr)` | Highlight selected cell; find matching events; call `showDetail()` |
| `showDetail(events)` | Populate and show `.cal-detail` panel; if no events, hide panel |
| `switchView(view)` | Toggle active tab class; show/hide `#calendar-view` and `#list-view` |
| `navigate(delta)` | Increment/decrement current month with year boundary wrapping (Jan−1 → Dec of previous year, Dec+1 → Jan of next year); re-render grid; clear detail panel |

**State:** Three module-level variables — `allEvents` (array), `currentYear` (number), `currentMonth` (number, 0-indexed).

**Default view:** Calendar tab is active on page load. `#list-view` has no hidden class in the raw HTML; `calendar.js` adds a `js-hidden` class to it on `init()` and activates the calendar tab. If `calendar.js` fails to load, the list renders as normal with no JS required.

---

## CSS Additions (appended to main.css)

New selectors — all scoped to avoid conflicts with existing styles:

```
.view-tabs            flex row, margin-bottom 1rem
.view-tab             border + border-radius pill button, navy outline
.view-tab.active      navy fill, white text
.cal-nav              flex row, space-between, align-center, margin-bottom 0.5rem
.cal-prev / .cal-next ghost button, navy text
.cal-month-label      font-weight 700, color navy
.cal-grid             CSS grid, 7 columns, equal width, gap 2px
.cal-day-header       uppercase 0.65rem, gray-600, text-center, padding 0.25rem
.cal-cell             min-height 2.5rem, text-center, border-radius 4px, relative, cursor default
.cal-cell.has-event   cursor pointer; ::after dot (navy 6px circle, bottom-center)
.cal-cell.deadline    ::after dot is pink
.cal-cell.selected    outline 2px solid orange, outline-offset 1px
.cal-cell.other-month color gray-200 (greyed out)
.cal-detail           white card, border-left 3px solid navy or pink, padding, margin-top 0.75rem, hidden by default
.cal-detail.visible   display block
```

---

## Interaction Spec

- **Tab toggle:** Click "☰ List" → shows `#list-view`, hides `#calendar-view`, swaps `.active` class. Click "📅 Calendar" → reverse. No page reload.
- **Month navigation:** ← and → buttons call `navigate(-1)` / `navigate(1)`. Grid re-renders; detail panel clears.
- **Date click (has events):** Cell gets `.selected`; `.cal-detail` populates and becomes `.visible`. Clicking a different date-with-events updates the panel. Clicking the same date again deselects (hides panel).
- **Date click (no events):** No selection, panel stays hidden or clears if previously open.
- **Detail panel content:** Event title, type badge (DEADLINE ⚠️ or EVENT), location (if present). One card per event on that date (supports multiple events on the same day).

---

## Admin Workflow (unchanged)

1. Admin visits `/admin`, authenticates via GitHub OAuth.
2. Adds event in "Events & Deadlines" collection using existing form fields: Title, Date, Location, Type.
3. Decap CMS commits new `_events/YYYY-MM-DD-slug.md` to master branch.
4. GitHub Actions rebuilds Jekyll (~1 min); new event appears in both the JSON blob and the list view automatically.

**Test event to add during admin test:** Graduate Scholarship — Internal Deadline, date 2025-05-11, type deadline, no location.

---

## Out of Scope

- Past-event filtering or hiding (all events shown regardless of date)
- Event detail pages or links
- iCal / export
- Recurring events
- Any changes to the password gate or admin auth
