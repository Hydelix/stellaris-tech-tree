// Small UI additions: version label, researched counter, keyboard-accessible researched toggles.
(function () {
  const AREAS = '#tech-tree-physics, #tech-tree-society, #tech-tree-engineering';

  const label = document.getElementById('version-label');
  if (label) label.textContent = document.title;

  function decorate() {
    document.querySelectorAll('#tech-tree .tech > div.node-status').forEach(el => {
      if (!el.hasAttribute('role')) {
        const name = el.parentElement.querySelector('.node-name');
        el.setAttribute('role', 'checkbox');
        el.setAttribute('aria-label', 'Researched: ' + (name ? name.textContent : ''));
        el.tabIndex = 0;
      }
      el.setAttribute('aria-checked', el.classList.contains('active') ? 'true' : 'false');
    });
  }

  function progress() {
    const out = document.getElementById('progress');
    if (!out) return;
    let total = 0, done = 0;
    document.querySelectorAll(AREAS).forEach(tree => {
      tree.querySelectorAll('.node.tech').forEach(n => {
        const s = n.querySelector(':scope > div.node-status');
        if (!s || !n.id || n.id === 'undefined') return;
        total++;
        if (s.classList.contains('active')) done++;
      });
    });
    out.textContent = total ? 'Researched ' + done + ' of ' + total : '';
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; decorate(); progress(); });
  }

  // Space or Enter toggles a focused researched checkbox
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && t.matches && t.matches('div.node-status[role="checkbox"]') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      t.click();
    }
  });

  const start = setInterval(() => {
    const tree = document.getElementById('tech-tree');
    if (!tree) return;
    clearInterval(start);
    new MutationObserver(refresh).observe(tree, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    refresh();
  }, 100);
})();
