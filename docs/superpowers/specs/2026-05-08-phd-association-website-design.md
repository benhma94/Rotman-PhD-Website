# Rotman PhD Association — Internal Website Design Spec

**Date:** 2026-05-08
**Status:** Approved

---

## Context

The Rotman PhD Association needs a central internal website where PhD students can access resources, view upcoming events, and read notices. It should be accessible only to association members, easy to maintain without technical knowledge, and hosted for free on GitHub Pages.

---

## Tech Stack

| Decision | Choice | Reason |
|---|---|---|
| Site generator | Jekyll | Native GitHub Pages support — no CI/CD setup needed |
| Hosting | GitHub Pages | Free, version-controlled, push-to-deploy |
| CMS | Decap CMS (at `/admin`) | Form-based editor for non-technical admins; no backend required |
| Auth (site) | Client-side password gate | Appropriate for internal site; no backend needed |
| Auth (CMS) | GitHub OAuth | Decap CMS standard; admins need a GitHub account |

---

## Authentication Model

Two shared passwords stored as SHA-256 hashes in `assets/js/auth.js` (a dedicated client-side auth file, not exposed by Jekyll's templating):

| Password | Access granted |
|---|---|
| **Student password** | Full site (read-only) |
| **Admin password** | Full site + Admin link visible in sidebar → Decap CMS at `/admin` |

- Password checked client-side in JS on page load
- On success, access level stored in `sessionStorage`
- Admin password also grants access to `/admin` (Decap CMS), where the user authenticates with their GitHub account to make edits

---

## Visual Design

**Colour palette** (from Rotman brand CSS):

| Name | Hex | Usage |
|---|---|---|
| Navy | `#004990` | Header bar, sidebar, headings |
| Pink (primary) | `#E20778` | Buttons, notice accents, active state |
| Orange | `#FCAF17` | Sidebar active indicator, highlights |
| Cyan | `#41C3DC` | Links |
| Black | `#000000` | Body text |
| Light grey | `#f8f9fa` | Page background |
| White | `#ffffff` | Cards |

**Typography:** `"Avenir Next LT", "Avenir Next", system-ui, sans-serif` (matches Rotman site)

---

## Layout

Persistent sidebar navigation + content area. Every page shares the same shell.

```
┌─────────────────────────────────────────┐
│  Navy top bar — "Rotman PhD Association"│
├──────────────┬──────────────────────────┤
│  Sidebar     │  Page content            │
│  (dark navy) │  (light grey bg)         │
│              │                          │
│  🏠 Home     │                          │
│  📁 Resources│                          │
│  📅 Events   │                          │
│  📢 Notices  │                          │
│              │                          │
│  ⚙️ Admin    │                          │
│  (admin only)│                          │
└──────────────┴──────────────────────────┘
```

Active sidebar item is highlighted with orange left border + gold text.

---

## Pages

### Home (Dashboard)
- Welcome banner (navy background, white text)
- Latest notice alert (pink left border, pulls first pinned item from `notices.yml`)
- Two side-by-side cards:
  - **Quick Resources** — 4–6 most recent/pinned links
  - **Upcoming Events** — next 3 events with date badges

### Resources (`/resources`)
- Links grouped by category (e.g. Guides, Policies, Forms, Admin)
- Each item: title + optional description + link
- Data source: `_data/resources.yml`

### Events (`/events`)
- Chronological list of events
- Each item: date badge (navy), title, optional location/notes
- Deadlines shown in pink with ⚠️ indicator
- Data source: `_data/events.yml`

### Notices (`/notices`)
- Full archive of notices, newest first
- Pinned notices appear at top
- Data source: `_data/notices.yml`

### Admin (`/admin`)
- Decap CMS — form-based editor for resources, events, and notices
- Only accessible when logged in with admin password
- Requires GitHub account authentication to save changes

---

## Content Data Files

```yaml
# _data/resources.yml
- title: "PhD Student Handbook"
  url: "https://..."
  category: "Guides"
  pinned: true

# _data/events.yml
- title: "Fall Welcome Reception"
  date: 2025-09-12
  location: "Rotman Atrium"
  type: event   # or: deadline

# _data/notices.yml
- title: "PhD Funding Application Deadline"
  date: 2025-10-01
  body: "Reminder to submit your funding application by Oct 1."
  pinned: true
```

---

## File Structure

```
rotman-phd-site/
├── _config.yml             ← site settings, hashed passwords
├── _data/
│   ├── resources.yml
│   ├── events.yml
│   └── notices.yml
├── _layouts/
│   └── default.html        ← sidebar shell + password gate
├── _includes/
│   ├── sidebar.html
│   └── password-gate.html
├── assets/
│   ├── css/main.css        ← Rotman colour scheme
│   └── js/auth.js          ← SHA-256 hashed passwords + access logic
├── admin/
│   ├── index.html          ← Decap CMS entry point
│   └── config.yml          ← Decap CMS configuration
├── index.md                ← Home/Dashboard
├── resources.md
├── events.md
└── notices.md
```

---

## Admin Workflow (Day-to-Day)

**To add a resource/event/notice:**
1. Open the site, log in with admin password
2. Click **Admin** in the sidebar
3. Authenticate with GitHub
4. Use the form editor to add/edit content
5. Click Save — GitHub builds and deploys automatically (~1 min)

**To change a password:** Update the SHA-256 hash in `assets/js/auth.js` and commit.

**To add a new admin:** Grant them Contributor access to the GitHub repo + share the admin password.

---

## Future Additions (Out of Scope for v1)

- Polls / voting
- Email reminders
- Per-user accounts (would require moving to a backend)

---

## Verification

After build:
1. Push to GitHub, confirm Pages deploys without errors
2. Open site — password gate appears before any content
3. Student password → full site visible, Admin link hidden in sidebar
4. Admin password → Admin link visible, `/admin` loads Decap CMS
5. Add a test notice via Decap CMS → confirm it appears on Notices page and dashboard after rebuild
6. Confirm Rotman colour scheme and sidebar layout render correctly on mobile
