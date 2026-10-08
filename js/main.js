// Einstiegspunkt
(function (L) {
  'use strict';
  // In eingebetteten Ansichten (z. B. als Artifact) bleibt der Spielstand bei Seiten-Updates erhalten.
  const hot = globalThis.window && window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => L.ui.snapshot());
  const start = (data) => L.ui.init(data || {});
  const boot = () => (hot && hot.ready ? hot.ready(start) : start(hot && hot.data));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(globalThis.LUN = globalThis.LUN || {});
