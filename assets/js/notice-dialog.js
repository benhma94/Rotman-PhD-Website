var NoticeDialog = (function () {
  var overlay  = document.getElementById('notice-dialog');
  var dlgDate  = document.getElementById('notice-dialog-date');
  var dlgTitle = document.getElementById('notice-dialog-title');
  var dlgBody  = document.getElementById('notice-dialog-body');
  var _closeHandler = null;

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
    if (_closeHandler) {
      overlay.removeEventListener('transitionend', _closeHandler);
      _closeHandler = null;
    }
    dlgDate.textContent  = subtitle || '';
    dlgTitle.textContent = title;
    dlgBody.innerHTML    = html;
    autolinkUrls(dlgBody);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
      });
    });
  }

  function close() {
    if (_closeHandler) overlay.removeEventListener('transitionend', _closeHandler);
    overlay.classList.remove('is-open');
    _closeHandler = function handler(e) {
      if (e.propertyName !== 'opacity') return;
      overlay.removeEventListener('transitionend', _closeHandler);
      _closeHandler = null;
      document.body.style.overflow = '';
    };
    overlay.addEventListener('transitionend', _closeHandler);
  }

  return { open: open };
}());
