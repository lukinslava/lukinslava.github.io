// The homepage is no longer a Framer page (tools/case/index.html), but Framer's
// router still knows its old home and would render it in place on a click to "./".
// Catch home links before React does and load the real page instead.
document.addEventListener("click", (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest("a[href]");
  if (!a || a.target === "_blank") return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== "/") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  location.href = url.href;
}, true);
