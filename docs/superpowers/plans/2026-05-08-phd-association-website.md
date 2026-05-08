# Rotman PhD Association Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Jekyll static site on GitHub Pages for the Rotman PhD Association with a client-side password gate (two access levels), sidebar navigation, dashboard home, resources/events/notices pages, and a Decap CMS editor for admins.

**Architecture:** Jekyll with GitHub Pages native build (no CI/CD required). Content stored as Jekyll collections (`_notices/`, `_events/`, `_resources/`) — each item is a Markdown file with front matter, managed through Decap CMS at `/admin`. A client-side password gate with SHA-256 hashing controls access; session state is stored in `sessionStorage`.

**Tech Stack:** Jekyll (github-pages gem), Liquid templating, vanilla CSS, vanilla JS (Web Crypto API), Decap CMS 3.x, GitHub Pages, GitHub OAuth (PKCE flow)

---

## File Map

| File | Purpose |
|---|---|
| `Gemfile` | Jekyll + github-pages gem |
| `_config.yml` | Site config + collection definitions |
| `.gitignore` | Ignore build artifacts |
| `assets/css/main.css` | Full Rotman colour scheme + layout |
| `assets/js/auth.js` | SHA-256 password gate + sessionStorage logic |
| `_layouts/default.html` | Full HTML shell: top bar, sidebar, content slot, gate |
| `_includes/sidebar.html` | Sidebar nav with active state + admin link |
| `_includes/password-gate.html` | Fullscreen password overlay |
| `_notices/*.md` | Notice entries (front matter only) |
| `_events/*.md` | Event entries (front matter only) |
| `_resources/*.md` | Resource entries (front matter only) |
| `index.html` | Dashboard: welcome banner, notice alert, resource + event cards |
| `resources.html` | Resources list grouped by category |
| `events.html` | Chronological events list |
| `notices.html` | Full notices archive |
| `admin/index.html` | Decap CMS entry point |
| `admin/config.yml` | Decap CMS collection definitions |

---

## Task 1: Jekyll Project Scaffold

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Create: `.gitignore`

- [ ] **Step 1: Verify Ruby and Bundler are installed**

```bash
ruby --version   # should be 3.x
gem install bundler
```

Expected: Ruby version printed, no errors.

- [ ] **Step 2: Create `Gemfile`**

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick"
```

- [ ] **Step 3: Create `_config.yml`**

```yaml
title: "Rotman PhD Association"
description: "Internal portal for Rotman PhD students"
baseurl: ""   # Change to "/repo-name" if NOT using a custom domain or username.github.io
url: ""       # Set after deploying, e.g. "https://username.github.io"

markdown: kramdown
permalink: pretty

collections:
  notices:
    output: false
    sort_by: date
  events:
    output: false
    sort_by: date
  resources:
    output: false

defaults:
  - scope:
      path: ""
    values:
      layout: "default"
```

- [ ] **Step 4: Create `.gitignore`**

```
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
Gemfile.lock
vendor/
.bundle/
```

- [ ] **Step 5: Install gems and verify Jekyll starts**

```bash
bundle install
bundle exec jekyll serve
```

Expected: Server running at `http://localhost:4000`. You'll see a blank page or 404 — that's fine, no pages exist yet.

- [ ] **Step 6: Commit**

```bash
git init
git add Gemfile _config.yml .gitignore
git commit -m "feat: scaffold Jekyll project"
```

---

## Task 2: CSS — Rotman Colour Scheme + Layout

**Files:**
- Create: `assets/css/main.css`

- [ ] **Step 1: Create `assets/css/main.css`**

```css
:root {
  --navy:          #004990;
  --navy-dark:     #002f66;
  --pink:          #E20778;
  --orange:        #FCAF17;
  --cyan:          #41C3DC;
  --black:         #000000;
  --gray-100:      #f8f9fa;
  --gray-200:      #e9ecef;
  --gray-600:      #6c757d;
  --white:         #ffffff;
  --sidebar-width: 200px;
  --topbar-height: 52px;
  --font: "Avenir Next LT", "Avenir Next", system-ui, -apple-system, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: var(--gray-100);
  color: var(--black);
  font-size: 1rem;
  line-height: 1.5;
}

/* ── Password gate ─────────────────────────── */
#password-gate {
  position: fixed;
  inset: 0;
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.gate-card {
  background: var(--white);
  padding: 2.5rem;
  border-radius: 8px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.gate-logo    { font-size: 1.2rem; font-weight: 700; color: var(--navy); margin-bottom: 0.25rem; }
.gate-subtitle { font-size: 0.85rem; color: var(--gray-600); margin-bottom: 1.5rem; }
.gate-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: 4px;
  font-family: var(--font);
  font-size: 1rem;
  margin-bottom: 0.75rem;
  outline: none;
  transition: border-color 0.2s;
}
.gate-input:focus { border-color: var(--navy); }
.gate-button {
  width: 100%;
  padding: 0.75rem;
  background: var(--navy);
  color: var(--white);
  border: none;
  border-radius: 4px;
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.gate-button:hover { background: var(--navy-dark); }
.gate-error { color: var(--pink); font-size: 0.85rem; margin-top: 0.75rem; }

/* ── Site shell ────────────────────────────── */
.site-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ── Top bar ───────────────────────────────── */
.top-bar {
  background: var(--navy);
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}
.top-bar .site-title   { color: var(--white); font-weight: 700; font-size: 1rem; }
.top-bar .academic-year { color: rgba(255,255,255,0.6); font-size: 0.85rem; }

/* ── Layout ────────────────────────────────── */
.layout {
  display: flex;
  margin-top: var(--topbar-height);
  min-height: calc(100vh - var(--topbar-height));
}

/* ── Sidebar ───────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--navy-dark);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: var(--topbar-height);
  bottom: 0;
  overflow-y: auto;
  padding: 1rem 0;
}
.sidebar nav { display: flex; flex-direction: column; flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1.25rem;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  font-size: 0.9rem;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}
.nav-item:hover { background: rgba(255,255,255,0.07); color: var(--white); }
.nav-item.active {
  color: var(--orange);
  border-left-color: var(--orange);
  background: rgba(255,255,255,0.07);
  font-weight: 600;
}
.sidebar-footer {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 0.5rem;
  margin-top: auto;
}

/* ── Main content ──────────────────────────── */
.content {
  margin-left: var(--sidebar-width);
  padding: 2rem;
  flex: 1;
}

/* ── Cards ─────────────────────────────────── */
.card {
  background: var(--white);
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.card-header {
  font-size: 0.7rem;
  color: var(--navy);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

/* ── Dashboard ─────────────────────────────── */
.welcome-banner {
  background: var(--navy);
  color: var(--white);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
}
.welcome-banner h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.25rem; }
.welcome-banner p  { opacity: 0.8; font-size: 0.9rem; }

.notice-alert {
  background: var(--white);
  border-left: 4px solid var(--pink);
  border-radius: 0 8px 8px 0;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-bottom: 1.25rem;
}
.notice-alert .notice-label {
  font-size: 0.7rem;
  color: var(--pink);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.2rem;
}
.notice-alert .notice-title { font-size: 0.95rem; font-weight: 600; }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.resource-link {
  display: block;
  color: var(--cyan);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.2rem 0;
}
.resource-link:hover { text-decoration: underline; }

.event-item { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.75rem; }
.date-badge {
  background: var(--navy);
  color: var(--white);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
  line-height: 1.3;
  flex-shrink: 0;
}
.date-badge.deadline { background: var(--pink); }
.event-title { font-size: 0.9rem; }
.event-title.deadline { color: var(--pink); font-weight: 600; }

/* ── Page headers ──────────────────────────── */
.page-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--navy); }
.page-header h1 { font-size: 1.6rem; color: var(--navy); font-weight: 700; }

/* ── Resources page ────────────────────────── */
.resource-category { margin-bottom: 1.5rem; }
.category-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}
.resource-item {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--gray-100);
}
.resource-item a { color: var(--cyan); font-weight: 600; text-decoration: none; }
.resource-item a:hover { text-decoration: underline; }
.resource-desc { font-size: 0.85rem; color: var(--gray-600); }

/* ── Notices page ──────────────────────────── */
.notice-item {
  background: var(--white);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border-left: 3px solid transparent;
}
.notice-item.pinned { border-left-color: var(--pink); }
.notice-date  { font-size: 0.8rem; color: var(--gray-600); margin-bottom: 0.2rem; }
.notice-title { font-weight: 600; margin-bottom: 0.25rem; }
.notice-body  { font-size: 0.9rem; color: var(--gray-600); }

/* ── Events page ───────────────────────────── */
.event-full-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: var(--white);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.event-full-badge {
  background: var(--navy);
  color: var(--white);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  text-align: center;
  min-width: 55px;
  flex-shrink: 0;
}
.event-full-badge.deadline { background: var(--pink); }
.badge-day   { font-size: 1.2rem; font-weight: 700; line-height: 1; }
.badge-month { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; }
.event-info h3       { font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; }
.event-location { font-size: 0.85rem; color: var(--gray-600); }

/* ── Responsive ────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
    padding: 0.25rem 0;
  }
  .sidebar nav     { flex-direction: row; flex-wrap: wrap; }
  .sidebar-footer  { border-top: none; padding: 0; margin: 0; }
  .nav-item        { padding: 0.5rem 0.75rem; border-left: none; border-bottom: 3px solid transparent; font-size: 0.8rem; }
  .nav-item.active { border-bottom-color: var(--orange); border-left-color: transparent; }
  .layout          { flex-direction: column; }
  .content         { margin-left: 0; padding: 1rem; }
  .dashboard-grid  { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Verify file exists**

```bash
ls assets/css/main.css
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "feat: add Rotman colour scheme and layout CSS"
```

---

## Task 3: Default Layout + Sidebar

**Files:**
- Create: `_layouts/default.html`
- Create: `_includes/sidebar.html`

- [ ] **Step 1: Create `_layouts/default.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ page.title | default: site.title }}</title>
  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
</head>
<body>

  {% include password-gate.html %}

  <div class="site-shell" id="site-shell" style="display:none">
    <header class="top-bar">
      <span class="site-title">Rotman PhD Association</span>
      <span class="academic-year">2025–2026</span>
    </header>
    <div class="layout">
      {% include sidebar.html %}
      <main class="content">
        {{ content }}
      </main>
    </div>
  </div>

  <script src="{{ '/assets/js/auth.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 2: Create `_includes/sidebar.html`**

```html
<aside class="sidebar">
  <nav>
    <a href="{{ '/' | relative_url }}"
       class="nav-item {% if page.url == '/' %}active{% endif %}">
      🏠 Home
    </a>
    <a href="{{ '/resources' | relative_url }}"
       class="nav-item {% if page.url contains 'resources' %}active{% endif %}">
      📁 Resources
    </a>
    <a href="{{ '/events' | relative_url }}"
       class="nav-item {% if page.url contains 'events' %}active{% endif %}">
      📅 Events
    </a>
    <a href="{{ '/notices' | relative_url }}"
       class="nav-item {% if page.url contains 'notices' %}active{% endif %}">
      📢 Notices
    </a>
  </nav>
  <div class="sidebar-footer">
    <a href="{{ '/admin' | relative_url }}"
       class="nav-item"
       id="admin-link"
       style="display:none">
      ⚙️ Admin
    </a>
  </div>
</aside>
```

- [ ] **Step 3: Commit**

```bash
git add _layouts/default.html _includes/sidebar.html
git commit -m "feat: add default layout and sidebar"
```

---

## Task 4: Password Gate

**Files:**
- Create: `_includes/password-gate.html`
- Create: `assets/js/auth.js`

- [ ] **Step 1: Generate password hashes**

Pick two passwords (one for students, one for admins), then run this in your terminal to get their SHA-256 hashes:

```bash
node -e "
const crypto = require('crypto');
const student = 'YOUR_STUDENT_PASSWORD';
const admin   = 'YOUR_ADMIN_PASSWORD';
console.log('student:', crypto.createHash('sha256').update(student).digest('hex'));
console.log('admin:',   crypto.createHash('sha256').update(admin).digest('hex'));
"
```

Copy the two hex strings — you'll paste them into `auth.js` in the next step.

- [ ] **Step 2: Create `assets/js/auth.js`**

Replace `STUDENT_HASH_HERE` and `ADMIN_HASH_HERE` with the hashes from Step 1.

```javascript
const ACCESS = {
  student: 'STUDENT_HASH_HERE',
  admin:   'ADMIN_HASH_HERE'
};

async function sha256(str) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function unlockSite(level) {
  document.getElementById('password-gate').style.display  = 'none';
  document.getElementById('site-shell').style.display     = 'flex';
  document.getElementById('site-shell').style.flexDirection = 'column';
  if (level === 'admin') {
    const link = document.getElementById('admin-link');
    if (link) link.style.display = 'flex';
  }
}

async function checkPassword() {
  const input = document.getElementById('password-input').value;
  const hash  = await sha256(input);
  if (hash === ACCESS.admin) {
    sessionStorage.setItem('phd-access', 'admin');
    unlockSite('admin');
  } else if (hash === ACCESS.student) {
    sessionStorage.setItem('phd-access', 'student');
    unlockSite('student');
  } else {
    document.getElementById('password-error').style.display = 'block';
  }
}

// Restore session on page load
const saved = sessionStorage.getItem('phd-access');
if (saved) {
  unlockSite(saved);
} else {
  document.getElementById('password-gate').style.display = 'flex';
}

// Allow Enter key
document.getElementById('password-input')
  .addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
```

- [ ] **Step 3: Create `_includes/password-gate.html`**

```html
<div id="password-gate" style="display:none">
  <div class="gate-card">
    <div class="gate-logo">Rotman PhD Association</div>
    <div class="gate-subtitle">Internal Portal — Members Only</div>
    <input
      type="password"
      id="password-input"
      class="gate-input"
      placeholder="Enter password"
      autocomplete="current-password"
    >
    <button class="gate-button" onclick="checkPassword()">Sign In</button>
    <div id="password-error" class="gate-error" style="display:none">
      Incorrect password. Please try again.
    </div>
  </div>
</div>
```

- [ ] **Step 4: Start Jekyll and test the gate**

```bash
bundle exec jekyll serve
```

Open `http://localhost:4000`. You should see the navy password gate overlay. Enter the student password — the site shell should appear. Refresh — session should persist (no gate shown). Open a private/incognito window — gate should appear again.

- [ ] **Step 5: Test admin password**

In the incognito window, enter the admin password. The Admin link in the sidebar footer should become visible.

- [ ] **Step 6: Commit**

```bash
git add _includes/password-gate.html assets/js/auth.js
git commit -m "feat: add two-level client-side password gate"
```

---

## Task 5: Sample Content — Collections

**Files:**
- Create: `_notices/2025-10-01-funding-deadline.md`
- Create: `_notices/2025-09-01-welcome-letter.md`
- Create: `_events/2025-09-12-fall-reception.md`
- Create: `_events/2025-10-03-research-mixer.md`
- Create: `_events/2025-10-01-funding-deadline.md`
- Create: `_resources/phd-handbook.md`
- Create: `_resources/funding-guide.md`
- Create: `_resources/association-policies.md`
- Create: `_resources/welcome-letter.md`

- [ ] **Step 1: Create notice files**

`_notices/2025-10-01-funding-deadline.md`:
```markdown
---
title: "PhD Funding Application Deadline"
date: 2025-10-01
body: "Reminder to all students: the doctoral funding application closes October 1. Submit via the SGS portal."
pinned: true
---
```

`_notices/2025-09-01-welcome-letter.md`:
```markdown
---
title: "Welcome Back — 2025–2026 Academic Year"
date: 2025-09-01
body: "The PhD Association welcomes returning and incoming students. Our first meeting is September 12."
pinned: false
---
```

- [ ] **Step 2: Create event files**

`_events/2025-09-12-fall-reception.md`:
```markdown
---
title: "Fall Welcome Reception"
date: 2025-09-12
location: "Rotman Atrium, 105 St George St"
type: event
---
```

`_events/2025-10-03-research-mixer.md`:
```markdown
---
title: "Research Mixer"
date: 2025-10-03
location: "Rotman Common Room"
type: event
---
```

`_events/2025-10-01-funding-deadline.md`:
```markdown
---
title: "Funding Application Deadline"
date: 2025-10-01
location: "SGS Portal (online)"
type: deadline
---
```

- [ ] **Step 3: Create resource files**

`_resources/phd-handbook.md`:
```markdown
---
title: "PhD Student Handbook"
url: "https://www.rotman.utoronto.ca/programs/phd-program/"
category: "Guides"
description: "Official Rotman PhD program guide."
pinned: true
---
```

`_resources/funding-guide.md`:
```markdown
---
title: "Funding & Awards Guide"
url: "https://www.sgs.utoronto.ca/awards/"
category: "Guides"
description: "SGS portal for all doctoral funding opportunities."
pinned: true
---
```

`_resources/association-policies.md`:
```markdown
---
title: "Association Policies"
url: "#"
category: "Policies"
description: "Internal bylaws and operating policies of the PhD Association."
pinned: false
---
```

`_resources/welcome-letter.md`:
```markdown
---
title: "Welcome Letter 2025–2026"
url: "#"
category: "Admin"
description: "Welcome letter from the association president."
pinned: true
---
```

- [ ] **Step 4: Verify Jekyll reads collections**

```bash
bundle exec jekyll build --verbose 2>&1 | grep -i "collection\|notice\|event\|resource"
```

Expected: Lines mentioning the collection files being processed.

- [ ] **Step 5: Commit**

```bash
git add _notices/ _events/ _resources/
git commit -m "feat: add sample content collections"
```

---

## Task 6: Home / Dashboard Page

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`**

```html
---
title: Home
---

<div class="welcome-banner">
  <h1>Welcome, PhD Students 👋</h1>
  <p>Your association hub for resources, events, and notices.</p>
</div>

{% assign pinned_notice = site.notices | where: "pinned", true | sort: "date" | reverse | first %}
{% if pinned_notice %}
<div class="notice-alert">
  <span style="font-size:1.5rem">📢</span>
  <div>
    <div class="notice-label">Latest Notice</div>
    <div class="notice-title">{{ pinned_notice.title }}</div>
  </div>
</div>
{% endif %}

<div class="dashboard-grid">

  <div class="card">
    <div class="card-header">📁 Quick Resources</div>
    {% assign pinned_resources = site.resources | where: "pinned", true %}
    {% for r in pinned_resources limit: 6 %}
    <a class="resource-link" href="{{ r.url }}" target="_blank" rel="noopener noreferrer">
      {{ r.title }}
    </a>
    {% endfor %}
  </div>

  <div class="card">
    <div class="card-header">📅 Upcoming Events</div>
    {% assign upcoming = site.events | sort: "date" %}
    {% for event in upcoming limit: 4 %}
    <div class="event-item">
      <div class="date-badge {% if event.type == 'deadline' %}deadline{% endif %}">
        {{ event.date | date: "%b" | upcase }}<br>
        {{ event.date | date: "%-d" }}
      </div>
      <div class="event-title {% if event.type == 'deadline' %}deadline{% endif %}">
        {{ event.title }}{% if event.type == 'deadline' %} ⚠️{% endif %}
      </div>
    </div>
    {% endfor %}
  </div>

</div>
```

- [ ] **Step 2: Verify dashboard renders**

```bash
bundle exec jekyll serve
```

Open `http://localhost:4000`. After entering the password you should see: welcome banner, a pink notice alert (Funding Deadline), two cards side by side (Quick Resources + Upcoming Events). Confirm the resource links and event dates are populated from the sample data.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add dashboard home page"
```

---

## Task 7: Resources Page

**Files:**
- Create: `resources.html`

- [ ] **Step 1: Create `resources.html`**

```html
---
title: Resources
---

<div class="page-header">
  <h1>📁 Resources</h1>
</div>

{% assign categories = site.resources | map: "category" | uniq | sort %}
{% for category in categories %}
<div class="resource-category">
  <div class="category-label">{{ category }}</div>
  {% assign cat_resources = site.resources | where: "category", category | sort: "title" %}
  {% for r in cat_resources %}
  <div class="resource-item">
    <a href="{{ r.url }}" target="_blank" rel="noopener noreferrer">{{ r.title }}</a>
    {% if r.description %}
    <span class="resource-desc">— {{ r.description }}</span>
    {% endif %}
  </div>
  {% endfor %}
</div>
{% endfor %}
```

- [ ] **Step 2: Verify resources page**

Open `http://localhost:4000/resources`. You should see resources grouped by category (Admin, Guides, Policies) with links and descriptions.

- [ ] **Step 3: Commit**

```bash
git add resources.html
git commit -m "feat: add resources page"
```

---

## Task 8: Events Page

**Files:**
- Create: `events.html`

- [ ] **Step 1: Create `events.html`**

```html
---
title: Events
---

<div class="page-header">
  <h1>📅 Events & Deadlines</h1>
</div>

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
```

- [ ] **Step 2: Verify events page**

Open `http://localhost:4000/events`. You should see three items in date order: Fall Reception (Sep 12), Funding Deadline (Oct 1, pink badge), Research Mixer (Oct 3).

- [ ] **Step 3: Commit**

```bash
git add events.html
git commit -m "feat: add events page"
```

---

## Task 9: Notices Page

**Files:**
- Create: `notices.html`

- [ ] **Step 1: Create `notices.html`**

```html
---
title: Notices
---

<div class="page-header">
  <h1>📢 Notices</h1>
</div>

{% assign pinned   = site.notices | where: "pinned", true  | sort: "date" | reverse %}
{% assign unpinned = site.notices | where: "pinned", false | sort: "date" | reverse %}
{% assign all_notices = pinned | concat: unpinned %}

{% for notice in all_notices %}
<div class="notice-item {% if notice.pinned %}pinned{% endif %}">
  <div class="notice-date">{{ notice.date | date: "%B %-d, %Y" }}{% if notice.pinned %} &nbsp;📌 Pinned{% endif %}</div>
  <div class="notice-title">{{ notice.title }}</div>
  {% if notice.body %}
  <div class="notice-body">{{ notice.body }}</div>
  {% endif %}
</div>
{% endfor %}
```

- [ ] **Step 2: Verify notices page**

Open `http://localhost:4000/notices`. The pinned Funding Deadline notice should appear first (with a pink left border), followed by the Welcome Back notice.

- [ ] **Step 3: Commit**

```bash
git add notices.html
git commit -m "feat: add notices page"
```

---

## Task 10: Decap CMS Setup

**Files:**
- Create: `admin/index.html`
- Create: `admin/config.yml`

**Prerequisites:** You need a GitHub OAuth App.

- [ ] **Step 1: Create a GitHub OAuth App**

1. Go to GitHub → Settings → Developer settings → OAuth Apps → "New OAuth App"
2. Fill in:
   - **Application name:** Rotman PhD Association CMS
   - **Homepage URL:** `https://YOUR_GITHUB_USERNAME.github.io` (update after deploy)
   - **Authorization callback URL:** `https://YOUR_GITHUB_USERNAME.github.io/admin/`
3. Click "Register application"
4. Copy the **Client ID** (you'll use it in `config.yml`)
5. Do NOT generate a client secret — PKCE flow doesn't need it

- [ ] **Step 2: Create `admin/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rotman PhD — Admin</title>
</head>
<body>
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `admin/config.yml`**

Replace `YOUR_GITHUB_USERNAME`, `YOUR_REPO_NAME`, and `YOUR_OAUTH_APP_CLIENT_ID` with real values.

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
  branch: main
  auth_type: pkce
  app_id: YOUR_OAUTH_APP_CLIENT_ID

media_folder: "assets/uploads"
public_folder: "/assets/uploads"

collections:
  - name: notices
    label: Notices
    label_singular: Notice
    folder: _notices
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    editor:
      preview: false
    fields:
      - { label: Title,  name: title,  widget: string }
      - { label: Date,   name: date,   widget: date,    format: YYYY-MM-DD }
      - { label: Body,   name: body,   widget: text,    required: false }
      - { label: Pinned, name: pinned, widget: boolean, default: false }

  - name: events
    label: Events & Deadlines
    label_singular: Event
    folder: _events
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    editor:
      preview: false
    fields:
      - { label: Title,    name: title,    widget: string }
      - { label: Date,     name: date,     widget: date,   format: YYYY-MM-DD }
      - { label: Location, name: location, widget: string, required: false }
      - label: Type
        name: type
        widget: select
        options:
          - { label: Event,    value: event }
          - { label: Deadline, value: deadline }
        default: event

  - name: resources
    label: Resources
    label_singular: Resource
    folder: _resources
    create: true
    slug: "{{slug}}"
    editor:
      preview: false
    fields:
      - { label: Title,       name: title,       widget: string }
      - { label: URL,         name: url,         widget: string }
      - label: Category
        name: category
        widget: select
        options: [Guides, Policies, Forms, Admin]
      - { label: Description, name: description, widget: text,    required: false }
      - { label: Pinned,      name: pinned,      widget: boolean, default: false }
```

- [ ] **Step 4: Verify admin page is not wrapped in password gate**

Because `admin/index.html` has no YAML front matter (`---` delimiters), Jekyll treats it as a static file and copies it as-is — the default layout (and password gate) are NOT applied. No changes to `_config.yml` are needed.

Confirm this by checking: `admin/index.html` starts with `<!DOCTYPE html>` and has no `---` at the top.

- [ ] **Step 5: Commit**

```bash
git add admin/index.html admin/config.yml
git commit -m "feat: add Decap CMS admin panel"
```

---

## Task 11: Deploy to GitHub Pages

- [ ] **Step 1: Create GitHub repository**

Go to github.com → New repository.
- Name: `phd-association` (or similar)
- Visibility: **Private** (recommended — keeps source code private even though the site is password-gated)
- Do NOT initialise with README

- [ ] **Step 2: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

- [ ] **Step 3: Enable GitHub Pages**

In the repo → Settings → Pages:
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)`
- Save

Wait ~2 minutes, then visit `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME` (or the URL shown in Pages settings).

- [ ] **Step 4: Update `_config.yml` with real URLs**

```yaml
baseurl: "/YOUR_REPO_NAME"   # omit if using custom domain or username.github.io repo
url: "https://YOUR_USERNAME.github.io"
```

Commit and push:

```bash
git add _config.yml
git commit -m "chore: set production URL"
git push
```

- [ ] **Step 5: Update GitHub OAuth App callback URL**

Go back to your OAuth App settings on GitHub and set:
- **Authorization callback URL:** `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/admin/`

- [ ] **Step 6: End-to-end verification**

Run through this checklist on the live site:

1. Visit the site URL — password gate appears
2. Enter student password → site unlocks, Admin link NOT visible in sidebar
3. Refresh page → stays unlocked (sessionStorage persists)
4. Open incognito window → gate appears again
5. Enter admin password → site unlocks, Admin link IS visible
6. Click Admin → `/admin` loads Decap CMS login screen
7. Click "Login with GitHub" → GitHub OAuth flow completes, CMS editor opens
8. Add a test notice via CMS → Save → GitHub shows a new commit in the repo
9. Wait ~1 min → new notice appears on `/notices` and dashboard
10. Confirm Rotman colours, sidebar, and dashboard layout look correct on mobile (resize browser)

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: production deploy verified"
git push
```

---

## Changing Passwords Later

To update either password:

```bash
node -e "
const crypto = require('crypto');
console.log(crypto.createHash('sha256').update('NEW_PASSWORD').digest('hex'));
"
```

Paste the new hash into `assets/js/auth.js`, commit, and push. GitHub Pages rebuilds automatically.
