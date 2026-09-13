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
  const CRAYON_ICONS = {
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

  // Crayon filters: wobbly edges + chalky grain. The "boil" version re-rolls the noise a few times a second
  // (hand-drawn animation feel) and is used on hover.
  const CRAYON_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
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


  // ---------- icon set 2: glossy jelly toys (rubber-duck poster reference) ----------
  // Translucent yellow "gummy" plastic with bright speculars, orange jelly details and a bit of chrome.
  const JELLY_ICONS = {
    trophy: `
      <path d="M15.2 13.4c-4.6-.9-7.4 1.2-7 4.6.4 3.3 3.6 5.2 8.3 4.6M32.8 13.4c4.6-.9 7.4 1.2 7 4.6-.4 3.3-3.6 5.2-8.3 4.6" stroke="url(#awj-orange)" stroke-width="3.4" fill="none"/>
      <rect x="20.6" y="29.5" width="6.8" height="8" rx="2.4" fill="url(#awj-orange)"/>
      <rect x="14.5" y="36" width="19" height="6.6" rx="3.3" fill="url(#awj-chrome)"/>
      <path d="M16.5 37.4h15" stroke="#fff" stroke-width="1.2" opacity=".8" stroke-linecap="round"/>
      <path d="M13.2 8.2h21.6v11.6c0 6.6-4.8 11.6-10.8 11.6S13.2 26.4 13.2 19.8z" fill="url(#awj-yellow)"/>
      <path d="M13.2 8.2h21.6v11.6c0 6.6-4.8 11.6-10.8 11.6S13.2 26.4 13.2 19.8z" fill="none" stroke="#d98200" stroke-width="1.1" opacity=".45"/>
      <ellipse cx="24" cy="9" rx="10.4" ry="1.7" fill="#fff5b8" opacity=".7"/>
      <path d="M26.6 28.6c3.4-1 5.6-3.6 6-7" stroke="#fff6b0" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
      <path d="M16.2 12.2c-.4 4.2.2 8 2.4 11" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".95"/>
      <circle cx="30.8" cy="12.6" r="1.3" fill="#fff"/>`,
    rosette: `
      <path d="M17.6 26.6l-4.6 14.8 6.2-2.4 3.6 5.2 2.4-14.2z" fill="url(#awj-orange)"/>
      <path d="M30.4 26.6l4.6 14.8-6.2-2.4-3.6 5.2-2.4-14.2z" fill="url(#awj-orange)"/>
      <path d="M16.2 32.6l1.4-4.6" stroke="#ffd2b8" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <circle cx="24" cy="17.4" r="12.6" fill="url(#awj-yellow)"/>
      <circle cx="24" cy="17.4" r="12.1" fill="none" stroke="#d98200" stroke-width="1.1" opacity=".45"/>
      <circle cx="24" cy="17.4" r="6.4" fill="url(#awj-orange)"/>
      <path d="M26.4 22.2c1.6-.8 2.6-2.4 2.8-4.2" stroke="#ffd0ad" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <path d="M14.2 14.6c1-3.8 4-6.6 7.8-7.4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".95"/>
      <circle cx="21.6" cy="14.6" r="1.1" fill="#fff"/>
      <path d="M17.6 25.8c3.8 2.4 9 2.4 12.8 0" stroke="#fff6b0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
    star: `
      <path d="M24 5.2c1.2 0 2 .7 2.6 1.9l3.8 7.8 8.5 1.2c2.6.4 3.4 2.9 1.5 4.7l-6.2 6 1.5 8.5c.4 2.6-1.7 4.1-4 2.9L24 34.2l-7.7 4c-2.3 1.2-4.4-.3-4-2.9l1.5-8.5-6.2-6c-1.9-1.8-1.1-4.3 1.5-4.7l8.5-1.2 3.8-7.8c.6-1.2 1.4-1.9 2.6-1.9z" fill="url(#awj-yellow)"/>
      <path d="M24 5.2c1.2 0 2 .7 2.6 1.9l3.8 7.8 8.5 1.2c2.6.4 3.4 2.9 1.5 4.7l-6.2 6 1.5 8.5c.4 2.6-1.7 4.1-4 2.9L24 34.2l-7.7 4c-2.3 1.2-4.4-.3-4-2.9l1.5-8.5-6.2-6c-1.9-1.8-1.1-4.3 1.5-4.7l8.5-1.2 3.8-7.8c.6-1.2 1.4-1.9 2.6-1.9z" fill="none" stroke="#d98200" stroke-width="1.1" opacity=".45"/>
      <path d="M24 16.4l1.7 3.5 3.9.6-2.8 2.7.7 3.8-3.5-1.8-3.5 1.8.7-3.8-2.8-2.7 3.9-.6z" fill="#fff1a0" opacity=".55"/>
      <path d="M21.8 9.4l-2.6 5.6-6.4 1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>
      <circle cx="33.6" cy="18.8" r="1.1" fill="#fff"/>
      <path d="M19.6 33.6c2.8-1.4 6-1.4 8.8 0" stroke="#fff6b0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
      <path d="M40.6 34.4l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="url(#awj-chrome)"/>`,
    medal: `
      <path d="M13.6 3.8h7.6l6.2 14.6h-7.6z" fill="url(#awj-orange)"/>
      <path d="M34.4 3.8h-7.6l-6.2 14.6h7.6z" fill="url(#awj-yellow)"/>
      <path d="M16.2 5.6l4.8 11" stroke="#ffd2b8" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
      <circle cx="24" cy="30" r="12" fill="url(#awj-chrome)"/>
      <circle cx="24" cy="30" r="8.6" fill="url(#awj-chrome-inner)"/>
      <path d="M24 24.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="url(#awj-yellow)"/>
      <ellipse cx="18.6" cy="24.4" rx="1.8" ry="4" transform="rotate(38 18.6 24.4)" fill="#fff" opacity=".95" filter="url(#awj-soft)"/>
      <circle cx="30.4" cy="35.6" r="1" fill="#fff" opacity=".8"/>`,
    gavel: `
      <rect x="8.4" y="37.6" width="18" height="5.4" rx="2.7" fill="url(#awj-yellow)"/>
      <path d="M24.4 23.4l14.4 14" stroke="url(#awj-orange)" stroke-width="5" stroke-linecap="round"/>
      <path d="M26.8 24.4l10.6 10.4" stroke="#ffd2b8" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>
      <g transform="rotate(45 20.6 16.4)">
        <rect x="11.6" y="11" width="18" height="10.8" rx="3" fill="url(#awj-chrome-h)"/>
        <rect x="8.2" y="9.6" width="5" height="13.6" rx="2.4" fill="url(#awj-yellow)"/>
        <rect x="28" y="9.6" width="5" height="13.6" rx="2.4" fill="url(#awj-yellow)"/>
        <path d="M13.8 13.2h13.4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".9"/>
      </g>
      <ellipse cx="11.6" cy="39" rx="2.4" ry=".9" fill="#fff" opacity=".85"/>`,
    close: `<path d="M14.5 14.5l19 19M33.5 14.5l-19 19" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>`,
  };

  const JELLY_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="awj-yellow" cx="56%" cy="62%" r="72%">
      <stop offset="0" stop-color="#fff2a0"/>
      <stop offset=".28" stop-color="#ffe23e"/>
      <stop offset=".7" stop-color="#fbbf06"/>
      <stop offset="1" stop-color="#e58f00"/>
    </radialGradient>
    <radialGradient id="awj-orange" cx="56%" cy="60%" r="78%">
      <stop offset="0" stop-color="#ffb07a"/>
      <stop offset=".45" stop-color="#ff6a1f"/>
      <stop offset="1" stop-color="#cf3a07"/>
    </radialGradient>
    <linearGradient id="awj-chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".35" stop-color="#b9bec4"/>
      <stop offset=".5" stop-color="#6f757c"/>
      <stop offset=".62" stop-color="#e9ecef"/>
      <stop offset="1" stop-color="#8b9097"/>
    </linearGradient>
    <linearGradient id="awj-chrome-h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f6f8"/>
      <stop offset=".45" stop-color="#8e949b"/>
      <stop offset=".6" stop-color="#dfe3e7"/>
      <stop offset="1" stop-color="#6c7178"/>
    </linearGradient>
    <linearGradient id="awj-chrome-inner" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#f2f4f6"/>
      <stop offset=".5" stop-color="#9aa0a6"/>
      <stop offset="1" stop-color="#5f646a"/>
    </linearGradient>
    <filter id="awj-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".45"/></filter>
  </defs></svg>`;


  // ---------- icon set 3: Braun (physical buttons reference) ----------
  // Light-grey device buttons with thin engraved glyphs, an orange main button, a status LED and an LCD label.
  const glyph = (d, color) => `<g transform="scale(2)" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">${d}</g>`;
  const BRAUN_GLYPH = "#5d5e5a";
  const BRAUN_ICONS = {
    trophy: glyph('<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M17 6h2.5a2 2 0 0 1 0 4H17M7 6H4.5a2 2 0 0 0 0 4H7"/>', "#a8430c"),
    rosette: glyph('<circle cx="12" cy="9" r="6"/><circle cx="12" cy="9" r="2.4"/><path d="M8.6 13.9L7 21.5l5-2.6 5 2.6-1.6-7.6"/>', BRAUN_GLYPH),
    star: glyph('<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>', BRAUN_GLYPH),
    medal: glyph('<path d="M8.5 3h7l-2 6h-3z"/><circle cx="12" cy="15" r="5.5"/><path d="M12 12.6l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>', BRAUN_GLYPH),
    gavel: glyph('<path d="M13.5 10.5l6.8 6.8a1.6 1.6 0 0 1-2.3 2.3l-6.8-6.8"/><path d="M8.6 3.4l6 6-3.2 3.2-6-6z"/><path d="M7.4 4.6L10.6 1.4M13.4 10.6l3.2-3.2M3 21h8"/>', BRAUN_GLYPH),
    close: glyph('<path d="M7 7l10 10M17 7L7 17" stroke-width="1.9"/>', "#a8430c"),
  };
  const BRAUN_SPRITE = "";

  const ICON_SETS = {
    crayon: { icons: CRAYON_ICONS, sprite: CRAYON_SPRITE, group: "aw-crayon", stroke: true },
    jelly: { icons: JELLY_ICONS, sprite: JELLY_SPRITE, group: "aw-jelly", stroke: false },
    braun: { icons: BRAUN_ICONS, sprite: BRAUN_SPRITE, group: "aw-braun", stroke: false, led: true },
  };
  const svg = (set, name, cls = "") =>
    `<svg class="aw-art ${cls}" viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="${set.group}">${set.icons[name]}</g></svg>`;

  const spritesAdded = new Set();
  function addSprite(style) {
    if (spritesAdded.has(style) || !ICON_SETS[style].sprite) return;
    spritesAdded.add(style);
    document.body.insertAdjacentHTML("beforeend", ICON_SETS[style].sprite);
  }

  // Creates one awards element pinned to the top-right area of the element returned by getBlock().
  // options.active(): whether it should be shown right now (e.g. only on the homepage).
  function mount(getBlock, style = "crayon", options = {}) {
    const SET = ICON_SETS[style] || ICON_SETS.crayon;
    const active = options.active || (() => true);
    addSprite(style);

    // ---------- markup ----------
    const root = document.createElement("div");
    root.className = "aw-radial";
    root.dataset.icons = style;
    root.hidden = true;
    root.innerHTML = `<button class="aw-trigger" type="button" aria-expanded="false" aria-label="Show awards">
        ${svg(SET, "trophy", "aw-ico-open")}${svg(SET, "close", "aw-ico-close")}
      </button>`;
    if (SET.led) root.insertAdjacentHTML("beforeend", '<span class="aw-led" aria-hidden="true"></span>');
    const trigger = root.querySelector(".aw-trigger");
    const items = AWARDS.map((award) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "aw-item";
      item.tabIndex = -1;
      item.setAttribute("aria-label", award.note ? `${award.name}, ${award.note}` : award.name);
      item.innerHTML = `${svg(SET, award.icon)}<span class="aw-label" aria-hidden="true">${award.name}${award.note ? `<small>${award.note}</small>` : ""}</span>`;
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

    // ---------- follow the block ----------
    let last = "";
    function sync() {
      const el = active() ? getBlock() : null;
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

    document.body.appendChild(root);
    layout();
    addEventListener("resize", layout);
    requestAnimationFrame(sync);
    return { root, setOpen };
  }

  window.AwardsRadial = { mount, styles: Object.keys(ICON_SETS) };

  // ---------- on the site: pin to the orange Experience block on the homepage ----------
  if (window.AW_MANUAL) return;

  let block = null;
  function findExperienceBlock() {
    if (block && block.isConnected) return block;
    block = null;
    const heading = [...document.querySelectorAll("h2")].find((h) => h.textContent.trim() === "Experience" && h.getClientRects().length);
    for (let el = heading?.parentElement; el && el !== document.body; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") { block = el; break; }
    }
    return block;
  }

  // Preview switch: ?icons=jelly (remembered for the tab so client-side navigation keeps it)
  let style = "crayon";
  try {
    const fromUrl = new URLSearchParams(location.search).get("icons");
    if (fromUrl && ICON_SETS[fromUrl]) sessionStorage.setItem("aw-icons", fromUrl);
    const saved = sessionStorage.getItem("aw-icons");
    if (saved && ICON_SETS[saved]) style = saved;
  } catch {}

  const start = () => mount(findExperienceBlock, style, { active: () => location.pathname === "/" });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
