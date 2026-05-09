# Event Time Support Design

**Date:** 2026-05-09
**Status:** Approved

## Overview

Add optional start and end times to events on the Rotman PhD website. Events without a time remain all-day; events with a time display in 12h AM/PM format and export as proper datetime entries in the iCal feed. Time zone is always America/Toronto (Eastern Time).

## Data Model

Each event `.md` file gains two optional front matter fields:

```yaml
start_time: "14:00"   # 24h HH:MM, omit for all-day
end_time:   "15:30"   # 24h HH:MM, omit if open-ended
```

Rules:
- No `start_time` → all-day event (existing behavior, no changes to existing files)
- `start_time` only → timed event with no end
- Both fields → timed event with a range

`date` stays `YYYY-MM-DD` — unchanged.

## CMS (admin/index.html)

Two new optional string fields added to the events collection, inserted after the existing `date` field:

```js
{ label: 'Start Time', name: 'start_time', widget: 'string', required: false,
  hint: '24h format, e.g. 14:00. Leave blank for all-day.' },
{ label: 'End Time',   name: 'end_time',   widget: 'string', required: false,
  hint: '24h format, e.g. 15:30. Leave blank if no end time.' },
```

No other CMS changes needed.

## Display (events.html + calendar.js)

Times are shown in 12h format with AM/PM, converted from the 24h front matter values at render time using JavaScript.

**Modal:**
A time row appears below the date when `start_time` is set.
- Start only: `2:00 PM`
- With end: `2:00 PM – 3:30 PM`

**List view:**
Same time string shown beneath the event title in a smaller muted style, consistent with how `location` is already displayed. Time formatting (24h → 12h AM/PM) is handled in JavaScript for both the modal and list view, since Liquid lacks robust time formatting — `start_time` and `end_time` are included in the event JSON already embedded in `events.html` for the calendar script.

**Calendar grid:**
No time shown in the grid cells (too small). Time detail is surfaced in the modal only.

## iCal Export (events.ics)

When `start_time` is absent, the export is unchanged (`VALUE=DATE`).

When `start_time` is present, the event switches to a datetime entry with the Eastern Time zone:

```
DTSTART;TZID=America/Toronto:20260511T140000
DTEND;TZID=America/Toronto:20260511T153000
```

If `start_time` is set but `end_time` is absent, `DTEND` defaults to one hour after `start_time`.

A `VTIMEZONE` block for `America/Toronto` is prepended once in the `.ics` file whenever any timed event exists — required by the iCal spec for `TZID` references to be valid.

## Files Affected

| File | Change |
|---|---|
| `_events/*.md` | New `start_time` / `end_time` fields (existing files unchanged) |
| `admin/index.html` | Two new CMS string fields in the events collection |
| `events.html` | Pass time fields into event JSON; show time in modal and list view |
| `events.ics` | Conditional datetime vs date export; VTIMEZONE block |
| `assets/js/calendar.js` | 24h→12h conversion helper; time display in modal trigger |

## Out of Scope

- Recurring events
- Per-event time zones (always Eastern Time)
- Displaying time on the calendar grid chips
