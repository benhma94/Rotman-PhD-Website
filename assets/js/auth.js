// crypto.subtle requires HTTPS — redirect if not secure
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  location.replace('https:' + location.href.slice(location.protocol.length));
}

const ACCESS = {
  student: 'f6a43f33db54228a5c5e27ee64a4948101ac586c4a949f6144011b3a1e017b60',
  admin:   '0e89f223e226ae63268cf39152ab75722e811b89d29efb22a852f1667bd22ae0'
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
    localStorage.setItem('phd-access', 'admin');
    unlockSite('admin');
  } else if (hash === ACCESS.student) {
    localStorage.setItem('phd-access', 'student');
    unlockSite('student');
  } else {
    errorEl.textContent = 'Incorrect password. Please try again.';
    errorEl.style.display = 'block';
  }
}

// Restore session on page load
const saved = localStorage.getItem('phd-access');
if (saved) {
  unlockSite(saved);
} else {
  document.getElementById('password-gate').style.display = 'flex';
}

// Allow Enter key
document.getElementById('password-input')
  .addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
