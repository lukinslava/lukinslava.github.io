// Before/after switch for the typography prototype: disables the injected stylesheet. Shortcut: T.
(() => {
  const link = document.querySelector('link[data-inject][href$="braun-type.css"]');
  if (!link) return;
  let on = true;
  try { on = localStorage.getItem("braun-type") !== "off"; } catch {}
  const bar = document.createElement("div");
  bar.setAttribute("style", "position:fixed;left:16px;bottom:16px;z-index:99999;display:flex;gap:4px;padding:4px;border-radius:999px;background:#1b1b1a;font:13px/1 'Helvetica Neue',Helvetica,Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)");
  const btn = (label, value) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => set(value);
    b.setAttribute("style", "border:0;border-radius:999px;padding:9px 14px;cursor:pointer;font:inherit");
    bar.append(b);
    return b;
  };
  const before = btn("before", false), after = btn("braun type", true);
  function set(v) {
    on = v; link.disabled = !v;
    try { localStorage.setItem("braun-type", v ? "on" : "off"); } catch {}
    for (const [b, active] of [[before, !v], [after, v]]) { b.style.background = active ? "#f97029" : "transparent"; b.style.color = active ? "#fff" : "#b9b8b2"; }
  }
  set(on);
  addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "t" && !/input|textarea/i.test(e.target.tagName)) set(!on); });
  document.body.append(bar);
})();
