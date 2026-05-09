var NoticeDialog = (function () {
  var overlay  = document.getElementById('notice-dialog');
  var dlgDate  = document.getElementById('notice-dialog-date');
  var dlgTitle = document.getElementById('notice-dialog-title');
  var dlgBody  = document.getElementById('notice-dialog-body');

  document.getElementById('notice-dialog-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.style.display !== 'none') close();
  });

  function open(title, subtitle, html) {
    dlgDate.textContent  = subtitle || '';
    dlgTitle.textContent = title;
    dlgBody.innerHTML    = html;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  return { open: open };
}());
