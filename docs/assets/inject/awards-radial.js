// Awards radial menu pinned to the top-right corner of the orange Experience block.
// Appended to <body> (outside React), follows the block's box on every frame so it stays in place
// through Framer's appear animations, resizes and client-side navigation. Shown on the homepage only.
(() => {
  const AWARDS = [
    { icon: "rosette", name: "Tagline Awards" },
    { icon: "star", name: "Golden Site Award" },
    { icon: "medal", name: "Workspace Digital Awards 2024" },
    { icon: "gavel", name: "Workspace Digital Awards 2025", note: "Jury member" },
  ];

  // Crayon palette (from the pastel crayon-on-photo reference)
  const C = { lilac: "#d98be8", pink: "#f06fbd", orange: "#ffa53a", sky: "#79c6f0", yellow: "#f7d23c", ink: "#1c1c1c" };

  // Hand-drawn icons on a 48x48 grid: slightly wobbly shapes, a fill in one colour and a scribbled outline in another.
  // They are rendered through the #aw-crayon filter (rough edges + chalky grain), see SPRITE below.
  const ICONS = {
    trophy: `
      <path d="M16.5 40.6c2.4-.5 12.6-.7 15.2.1" stroke="${C.sky}" stroke-width="4.3"/>
      <path d="M23.4 31.5c.3 3 .1 6.3-.4 8.6M25.2 31.4c-.1 3.1.2 6.1.6 8.7" stroke="${C.pink}" stroke-width="3.1"/>
      <path d="M13.8 8.9c6.6-.9 13.9-.8 20.6-.1.4 4.7.6 9.8-1.6 14-2.2 4.4-6.4 8.1-9.2 8.3-3.3-.4-7.5-4.4-9.3-8.9-1.5-4-1-8.6-.5-13.3z" fill="${C.yellow}"/>
      <path d="M13.8 8.9c6.6-.9 13.9-.8 20.6-.1.4 4.7.6 9.8-1.6 14-2.2 4.4-6.4 8.1-9.2 8.3-3.3-.4-7.5-4.4-9.3-8.9-1.5-4-1-8.6-.5-13.3" stroke="${C.pink}" stroke-width="2.9"/>
      <path d="M14 12.6c-3.6-.8-7 .6-6.6 4.3.4 3.4 4.2 4.6 7.6 4.3M34.2 12.5c3.8-.9 6.9.9 6.4 4.4-.5 3.3-4.1 4.5-7.4 4.1" stroke="${C.pink}" stroke-width="2.9"/>
      <path d="M19.2 13.8c.3 2.8 1.1 5.1 2.6 7" stroke="#fff" stroke-width="2.4" opacity=".9"/>`,
    rosette: `
      <path d="M17.6 27.4l-4.9 14.1 6.6-2.5 3.2 5.6 3.1-15.1M29.9 27.2l5.1 14.3-6.7-2.4-3.4 5.4" fill="${C.sky}"/>
      <path d="M17.6 27.4l-4.9 14.1 6.6-2.5 3.2 5.6 3.1-15.1M29.9 27.2l5.1 14.3-6.7-2.4-3.4 5.4" stroke="${C.pink}" stroke-width="2.6"/>
      <path d="M23.9 5.2c6.1-.3 11.4 4.2 11.6 10.4.2 6.4-4.9 11.6-11.4 11.7-6.2.1-11.3-4.6-11.5-10.8-.2-6.1 4.9-11 11.3-11.3z" fill="${C.lilac}"/>
      <path d="M23.9 5.2c6.1-.3 11.4 4.2 11.6 10.4.2 6.4-4.9 11.6-11.4 11.7-6.2.1-11.3-4.6-11.5-10.8-.2-6.3 5.2-11.1 11.6-11.1" stroke="${C.sky}" stroke-width="2.8"/>
      <path d="M24.1 10.9c3 0 5.2 2.2 5.2 5 .1 2.9-2.3 5.1-5.3 5.1-2.8-.1-5-2.3-5-5 0-2.8 2.2-5.1 5.1-5.1z" fill="${C.yellow}"/>`,
    star: `
      <path d="M24.3 5.8c1.9 4.3 3.3 8.6 5.4 12.6 4.4.4 8.9.8 13.2 1.9-3.3 3-6.9 5.6-10 8.9 1 4.5 2.4 8.9 3.1 13.4-3.9-2.3-7.6-5.1-11.7-7.1-4 2.3-7.9 4.9-12.1 6.9.9-4.5 2.4-8.8 3.2-13.3-3.3-3-6.9-5.8-9.9-9.1 4.4-.7 8.9-1.1 13.3-1.8 2-4.1 3.4-8.4 5.5-12.4z" fill="${C.yellow}"/>
      <path d="M24.3 5.8c1.9 4.3 3.3 8.6 5.4 12.6 4.4.4 8.9.8 13.2 1.9-3.3 3-6.9 5.6-10 8.9 1 4.5 2.4 8.9 3.1 13.4-3.9-2.3-7.6-5.1-11.7-7.1-4 2.3-7.9 4.9-12.1 6.9.9-4.5 2.4-8.8 3.2-13.3-3.3-3-6.9-5.8-9.9-9.1 4.4-.7 8.9-1.1 13.3-1.8 2-4.3 3.6-8.6 5.7-12.6" stroke="${C.orange}" stroke-width="2.9"/>
      <path d="M40.2 5.4v6.2M37.1 8.5h6.3" stroke="${C.sky}" stroke-width="2.6"/>
      <path d="M7.6 36.5v4.4M5.4 38.7h4.4" stroke="${C.pink}" stroke-width="2.4"/>`,
    medal: `
      <path d="M15.2 4.6l6.1 13.4M32.9 4.8l-6.3 13.3" stroke="${C.sky}" stroke-width="6.2"/>
      <path d="M19.6 4.9l5.3 11.6M28.6 4.7l-4.2 9.1" stroke="${C.pink}" stroke-width="2.6"/>
      <path d="M24.2 19.4c6.3-.2 11.6 4.6 11.7 10.9.1 6.5-5 11.8-11.5 11.9-6.4.1-11.6-4.9-11.8-11.2-.1-6.3 5.1-11.4 11.6-11.6z" fill="${C.orange}"/>
      <path d="M24.2 19.4c6.3-.2 11.6 4.6 11.7 10.9.1 6.5-5 11.8-11.5 11.9-6.4.1-11.6-4.9-11.8-11.2-.1-6.5 5.4-11.6 11.9-11.4" stroke="${C.pink}" stroke-width="2.8"/>
      <path d="M24.1 24.3l1.9 3.8 4.1.5-3 2.9.8 4.1-3.8-2-3.7 2 .8-4.1-3-2.9 4.2-.6z" fill="${C.yellow}"/>`,
    gavel: `
      <path d="M8.6 41.3c4.8-.4 10.3-.4 15.4.1" stroke="${C.lilac}" stroke-width="4.3"/>
      <path d="M24.6 22.3c4.9 4.8 9.8 9.8 14.9 14.4" stroke="${C.orange}" stroke-width="6.0"/>
      <path d="M12.3 16.8l9.6-9.8c3.4 2.5 6.8 5.6 9.6 9.3l-9.3 9.6c-3.6-2.7-7-5.6-9.9-9.1z" fill="${C.sky}"/>
      <path d="M12.3 16.8l9.6-9.8c3.4 2.5 6.8 5.6 9.6 9.3l-9.3 9.6c-3.6-2.7-7-5.6-9.9-9.1" stroke="${C.pink}" stroke-width="2.8"/>
      <path d="M9.4 13.9l9.9-10.2M25.3 29.1l9.7-10.1" stroke="${C.pink}" stroke-width="4.1"/>`,
    close: `<path d="M13 13.4c7.3 6.7 14.8 14 21.6 21.4M34.9 13c-7.4 7.2-14.6 14.5-21.5 22" stroke="#fff" stroke-width="4.3"/>`,
  };
  const svg = (name, cls = "") =>
    `<svg class="aw-art ${cls}" viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="aw-crayon">${ICONS[name]}</g></svg>`;

  // Crayon filters: wobbly edges + chalky grain. The "boil" version re-rolls the noise a few times a second
  // (hand-drawn animation feel) and is used on hover.
  const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <filter id="aw-crayon" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="rough"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="11" result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.55" result="grainMask"/>
      <feComposite in="rough" in2="grainMask" operator="in"/>
    </filter>
    <filter id="aw-crayon-boil" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" result="warp">
        <animate attributeName="seed" values="4;9;15" dur="0.36s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="rough"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="11" result="grain">
        <animate attributeName="seed" values="11;23;31" dur="0.36s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.55" result="grainMask"/>
      <feComposite in="rough" in2="grainMask" operator="in"/>
    </filter>
  </defs></svg>`;

  // ---------- markup ----------
  const root = document.createElement("div");
  root.className = "aw-radial";
  root.hidden = true;
  root.innerHTML = `<button class="aw-trigger" type="button" aria-expanded="false" aria-label="Show awards">
      ${svg("trophy", "aw-ico-open")}${svg("close", "aw-ico-close")}
    </button>`;
  const trigger = root.querySelector(".aw-trigger");
  const items = AWARDS.map((award) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "aw-item";
    item.tabIndex = -1;
    item.setAttribute("aria-label", award.note ? `${award.name}, ${award.note}` : award.name);
    item.innerHTML = `${svg(award.icon)}<span class="aw-label" aria-hidden="true">${award.name}${award.note ? `<small>${award.note}</small>` : ""}</span>`;
    item.addEventListener("click", () => {
      const wasActive = item.classList.contains("active");
      items.forEach((i) => i.classList.remove("active"));
      item.classList.toggle("active", !wasActive);
      fitLabel(item);
    });
    item.addEventListener("pointerenter", () => fitLabel(item));
    item.addEventListener("focus", () => fitLabel(item));
    root.appendChild(item);
    return item;
  });

  // Keep a label inside the viewport (long names on the leftmost item on phones).
  function fitLabel(item) {
    const label = item.querySelector(".aw-label");
    label.style.setProperty("--shift", "0px");
    const r = label.getBoundingClientRect();
    const margin = 8;
    let dx = 0;
    if (r.left < margin) dx = margin - r.left;
    else if (r.right > innerWidth - margin) dx = innerWidth - margin - r.right;
    label.style.setProperty("--shift", `${Math.round(dx)}px`);
  }

  // ---------- layout: items fly out to the left along the block's top strip, with a slight droop ----------
  function layout() {
    const mobile = innerWidth < 810;
    const gap = mobile ? 60 : 76;
    const droop = 2;
    const stagger = 40;
    items.forEach((item, i) => {
      const n = i + 1;
      item.style.setProperty("--x", `${-n * gap}px`);
      item.style.setProperty("--y", `${n * n * droop}px`);
      item.style.setProperty("--delay-in", `${i * stagger}ms`);
      item.style.setProperty("--delay-out", `${(items.length - 1 - i) * stagger * 0.6}ms`);
    });
  }

  function setOpen(open) {
    root.classList.toggle("open", open);
    root.classList.add("touched");
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "Hide awards" : "Show awards");
    items.forEach((item) => {
      item.tabIndex = open ? 0 : -1;
      if (!open) item.classList.remove("active");
    });
  }

  trigger.addEventListener("click", () => setOpen(!root.classList.contains("open")));
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("open")) {
      setOpen(false);
      trigger.focus();
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (root.classList.contains("open") && !root.contains(e.target)) setOpen(false);
  });

  // ---------- pin to the Experience block ----------
  let block = null;
  function findBlock() {
    if (block && block.isConnected) return block;
    block = null;
    const heading = [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === "Experience" && h.getClientRects().length);
    for (let el = heading?.parentElement; el && el !== document.body; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { block = el; break; }
    }
    return block;
  }

  let last = "";
  function sync() {
    const el = location.pathname === "/" ? findBlock() : null;
    if (!el) {
      if (!root.hidden) { root.hidden = true; setOpen(false); }
    } else {
      const r = el.getBoundingClientRect();
      const mobile = innerWidth < 810;
      const insetX = mobile ? 64 : 100; // distance of the button centre from the block's right edge
      const insetY = mobile ? 62 : 90; // ... and from its top edge
      const size = root.offsetWidth || 66;
      const left = r.right + scrollX - insetX - size / 2;
      const top = r.top + scrollY + insetY - size / 2;
      // Follow the block's appear animation (it fades in)
      const opacity = getComputedStyle(el).opacity;
      const key = `${left}|${top}|${opacity}`;
      if (key !== last) {
        root.style.left = `${left}px`;
        root.style.top = `${top}px`;
        root.style.opacity = opacity;
        last = key;
      }
      if (root.hidden) root.hidden = false;
    }
    requestAnimationFrame(sync);
  }

  const start = () => {
    document.body.insertAdjacentHTML("beforeend", SPRITE);
    document.body.appendChild(root);
    layout();
    addEventListener("resize", layout);
    requestAnimationFrame(sync);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
