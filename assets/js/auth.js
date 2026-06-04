// crypto.subtle requires HTTPS — redirect if not secure
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https:' + location.href.slice(location.protocol.length));
}

const ACCESS = {
  student: 'f6a43f33db54228a5c5e27ee64a4948101ac586c4a949f6144011b3a1e017b60',
  admin:   '0e89f223e226ae63268cf39152ab75722e811b89d29efb22a852f1667bd22ae0',
  accounting: '113b5ccba3c63df9386c308cffceb45954e3b62b21e30c46245d0a98c228852e',
  finance:    'b696d75511dc16f2b52563e3113a498311a79866f4672862197aa9a8c5c0da12',
  obhrm:      'a42b64f9be746ad66f4e64414adfacf27df49b07dba7d51cfd1d00a319bca146',
  strategy:   '6b27710dfaafdcec2b06b7d3c6abe56d98162848b08a9da01e88863e2add413f',
  marketing:  'f5904cf7a1231a7a13a8cffbd2f0482984a1c69e96fc48dd96be8858a1707e60',
  eap:        'c33b7e6d42b33642f0ebdc431657bad7f016c32070bd996004b66f27b2396912',
  operations: '358cc201f87d9dc9defd3eac467a62fae720aa99a76be8b98e0fc9b3893a427d'
};

// Department access levels that each unlock their own welcome-guide page.
const DEPARTMENTS = ['accounting','finance','obhrm','strategy','marketing','eap','operations'];

const ACCESS_KEY = 'phd-access';

async function sha256(str) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function saveAccess(level) {
  sessionStorage.setItem(ACCESS_KEY, level);
  localStorage.removeItem(ACCESS_KEY);
}

function clearAccess() {
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(ACCESS_KEY);
}

function restoreAccess() {
  const saved = sessionStorage.getItem(ACCESS_KEY);
  const legacySaved = localStorage.getItem(ACCESS_KEY);

  if (saved) return saved;

  if (legacySaved) {
    sessionStorage.setItem(ACCESS_KEY, legacySaved);
    localStorage.removeItem(ACCESS_KEY);
    return legacySaved;
  }

  return null;
}

function canAccess(level, required) {
  if (!required) return true;
  return level === 'admin' || level === required;
}

function requiredAccess() {
  const shell = document.getElementById('site-shell');
  return shell ? shell.dataset.requiredAccess : '';
}

function updateAccessVisibility(level) {
  document.querySelectorAll('[data-access]').forEach(el => {
    const allowed = canAccess(level, el.dataset.access);
    el.classList.toggle('js-hidden', !allowed);
  });

  document.querySelectorAll('.resource-category').forEach(category => {
    const items = category.querySelectorAll('.resource-item');
    if (items.length === 0) return;
    const hasVisibleItem = Array.from(items).some(item => !item.classList.contains('js-hidden'));
    category.classList.toggle('js-hidden', !hasVisibleItem);
  });
}

function showGateError(message) {
  const gate = document.getElementById('password-gate');
  const shell = document.getElementById('site-shell');
  const errorEl = document.getElementById('password-error');

  if (shell) shell.style.display = 'none';
  if (gate) gate.style.display = 'flex';
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function unlockSite(level) {
  const required = requiredAccess();
  if (!canAccess(level, required)) {
    showGateError('You don\'t have access to this page.');
    updateAccessVisibility(level);
    return false;
  }

  document.getElementById('password-gate').style.display  = 'none';
  document.getElementById('site-shell').style.display     = 'flex';
  document.getElementById('site-shell').style.flexDirection = 'column';

  const adminLink = document.getElementById('admin-link');

  // Hide every department link first, then reveal the relevant one(s).
  DEPARTMENTS.forEach(d => {
    const link = document.getElementById(d + '-link');
    if (link) link.style.display = 'none';
  });

  if (level === 'admin') {
    if (adminLink) adminLink.style.display = 'flex';
    DEPARTMENTS.forEach(d => {
      const link = document.getElementById(d + '-link');
      if (link) link.style.display = 'flex';
    });
  } else if (DEPARTMENTS.includes(level)) {
    const link = document.getElementById(level + '-link');
    if (link) link.style.display = 'flex';
  }

  updateAccessVisibility(level);
  return true;
}

async function checkPassword() {
  const input = document.getElementById('password-input').value;
  const errorEl = document.getElementById('password-error');
  let hash;
  try {
    hash = await sha256(input);
  } catch {
    errorEl.textContent = 'This site requires HTTPS. Please use https://rotmanphd.ca';
    errorEl.style.display = 'block';
    return;
  }
  if (hash === ACCESS.admin) {
    saveAccess('admin');
    unlockSite('admin');
  } else if (hash === ACCESS.student) {
    saveAccess('student');
    unlockSite('student');
  } else {
    const dept = DEPARTMENTS.find(d => hash === ACCESS[d]);
    if (dept) {
      saveAccess(dept);
      if (unlockSite(dept) && !requiredAccess()) {
        const link = document.getElementById(dept + '-link');
        location.assign(link ? link.href : '/resources/' + dept + '-welcome-guide/');
      }
    } else {
      errorEl.textContent = 'Incorrect password. Please try again.';
      errorEl.style.display = 'block';
    }
  }
}

function logoutSite() {
  clearAccess();
  document.getElementById('site-shell').style.display = 'none';
  document.getElementById('password-gate').style.display = 'flex';

  const passwordInput = document.getElementById('password-input');
  const errorEl = document.getElementById('password-error');
  const adminLink = document.getElementById('admin-link');

  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.focus();
  }
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
  if (adminLink) adminLink.style.display = 'none';
  DEPARTMENTS.forEach(d => {
    const link = document.getElementById(d + '-link');
    if (link) link.style.display = 'none';
  });
  updateAccessVisibility('');
}

// Restore session on page load
const saved = restoreAccess();
if (saved) {
  unlockSite(saved);
} else {
  document.getElementById('password-gate').style.display = 'flex';
}

// Allow Enter key
document.getElementById('password-input')
  .addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });

document.getElementById('logout-button')
  .addEventListener('click', logoutSite);
