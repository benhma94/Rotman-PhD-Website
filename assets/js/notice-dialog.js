var NoticeDialog = (function () {
  var overlay  = document.getElementById('notice-dialog');
  var dlgDate  = document.getElementById('notice-dialog-date');
  var dlgTitle = document.getElementById('notice-dialog-title');
  var dlgBody  = document.getElementById('notice-dialog-body');

  document.getElementById('notice-dialog-close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  function autolinkUrls(el) {
    var urlRe = /(https?:\/\/[^\s<>"]+)/g;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (n) {
      if (!urlRe.test(n.textContent)) return;
      urlRe.lastIndex = 0;
      var span = document.createElement('span');
      span.innerHTML = n.textContent.replace(urlRe, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      n.parentNode.replaceChild(span, n);
    });
  }

  function open(title, subtitle, html) {
    dlgDate.textContent  = subtitle || '';
    dlgTitle.textContent = title;
    dlgBody.innerHTML    = html;
    autolinkUrls(dlgBody);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', function handler() {
      overlay.removeEventListener('transitionend', handler);
      document.body.style.overflow = '';
    });
  }

  return { open: open };
}());
