// Awards "tuner": an orange corner button that powers a small Braun-style device with an LCD on and off.
// The LCD renders award names with a hand-built 14-segment display (SVG), long names scroll like an old car radio.
// Exposes window.AwardsTuner.mount(getBlock, options). Not auto-mounted on the site (preview only).
(() => {
  const AWARDS = [
    { name: "Tagline Awards" },
    { name: "Golden Site Award" },
    { name: "Workspace Digital Awards 2024", lcd: "WDA 24" },
    { name: "Workspace Digital Awards 2025", lcd: "WDA 25", jury: true },
  ];

  // ---------- 14-segment display ----------
  // Bits: A B C D E F G1 G2 H J K L M N (DP = 14). H/K upper diagonals, J/M centre verticals, L/N lower diagonals.
  const GLYPHS = {
    " ": 0x0000, "-": 0x00c0, ".": 0x4000, "/": 0x0c00, "'": 0x0200,
    0: 0x0c3f, 1: 0x0006, 2: 0x00db, 3: 0x008f, 4: 0x00e6, 5: 0x2069, 6: 0x00fd, 7: 0x0007, 8: 0x00ff, 9: 0x00ef,
    A: 0x00f7, B: 0x128f, C: 0x0039, D: 0x00de, /* drawn as a lowercase d: reads clearly on 14 segments */ E: 0x00f9, F: 0x00f1, G: 0x00bd, H: 0x00f6, I: 0x1209, J: 0x001e,
    K: 0x2470, L: 0x0038, M: 0x0536, N: 0x2136, O: 0x003f, P: 0x00f3, Q: 0x203f, R: 0x20f3, S: 0x018d, T: 0x1201,
    U: 0x003e, V: 0x0c30, W: 0x2836, X: 0x2d00, Y: 0x1500, Z: 0x0c09,
  };
  // Segment lines inside a 14x24 cell, in bit order
  const SEGMENTS = [
    [2.3, 1, 11.7, 1], [13, 2.3, 13, 10.7], [13, 13.3, 13, 21.7], [2.3, 23, 11.7, 23], [1, 13.3, 1, 21.7], [1, 2.3, 1, 10.7],
    [2.3, 12, 6.1, 12], [7.9, 12, 11.7, 12], [2.6, 2.8, 5.9, 10.2], [7, 2.3, 7, 10.7], [11.4, 2.8, 8.1, 10.2],
    [5.9, 13.8, 2.6, 21.2], [7, 13.3, 7, 21.7], [8.1, 13.8, 11.4, 21.2],
  ];
  const CELL = 17;
  const CHARS = 18;

  function lcdSvg(chars = CHARS) {
    let ghost = "";
    let cells = "";
    for (let c = 0; c < chars; c++) {
      const x = c * CELL + 3;
      const segs = SEGMENTS.map(([x1, y1, x2, y2], i) => `<line data-s="${i}" x1="${x + x1}" y1="${y1 + 2}" x2="${x + x2}" y2="${y2 + 2}"/>`).join("");
      ghost += segs;
      cells += `<g data-c="${c}">${segs}<circle data-s="14" cx="${x + 15.2}" cy="25" r="1"/></g>`;
    }
    return `<svg class="at-lcd-svg" viewBox="0 0 ${chars * CELL + 4} 28" aria-hidden="true">
      <g class="at-ghost" transform="skewX(-7) translate(3 0)">${ghost}</g>
      <g class="at-lit" transform="skewX(-7) translate(3 0)">${cells}</g>
    </svg>`;
  }

  function renderText(svgEl, text) {
    const cells = svgEl.querySelectorAll(".at-lit > g");
    cells.forEach((cell, i) => {
      const ch = (text[i] || " ").toUpperCase();
      const bits = GLYPHS[ch] ?? 0;
      cell.querySelectorAll("[data-s]").forEach((seg) => {
        seg.classList.toggle("on", Boolean(bits & (1 << Number(seg.dataset.s))));
      });
    });
  }

  // ---------- markup ----------
  const POWER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v8M7 6.6a7.5 7.5 0 1 0 10 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  function mount(getBlock, options = {}) {
    const active = options.active || (() => true);

    const trigger = document.createElement("div");
    trigger.className = "at-corner";
    trigger.hidden = true;
    trigger.innerHTML = `<button class="at-button at-button--main" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Turn on awards">${POWER}</button><span class="at-led" aria-hidden="true"></span>`;
    const mainBtn = trigger.querySelector("button");

    const device = document.createElement("div");
    device.className = "at-device";
    device.hidden = true;
    device.setAttribute("role", "dialog");
    device.setAttribute("aria-label", "Awards");
    device.innerHTML = `
      <div class="at-screen">
        <span class="at-ind at-ind--jury">JURY</span>
        <span class="at-ind at-ind--count"><b class="at-count">1</b>/${AWARDS.length}</span>
        ${lcdSvg()}
        <span class="at-sr" aria-live="polite"></span>
      </div>
      <div class="at-controls">
        <div class="at-small"><span class="at-cap">prev</span><button class="at-button at-button--small" type="button" data-dir="-1" aria-label="Previous award"></button></div>
        <div class="at-small"><span class="at-cap">next</span><button class="at-button at-button--small" type="button" data-dir="1" aria-label="Next award"></button></div>
      </div>`;

    const lcd = device.querySelector(".at-lcd-svg");
    const screen = device.querySelector(".at-screen");
    const count = device.querySelector(".at-count");
    const jury = device.querySelector(".at-ind--jury");
    const sr = device.querySelector(".at-sr");

    let index = 0;
    let open = false;
    let scrollTimer = 0;
    let bootTimer = 0;

    // Show one award; names longer than the display scroll one character at a time
    function show(i, { flicker = true } = {}) {
      index = (i + AWARDS.length) % AWARDS.length;
      const award = AWARDS[index];
      const text = (award.lcd || award.name).toUpperCase();
      count.textContent = String(index + 1);
      jury.classList.toggle("on", Boolean(award.jury));
      sr.textContent = `${award.name}${award.jury ? ", jury member" : ""}. ${index + 1} of ${AWARDS.length}`;
      clearTimeout(scrollTimer);
      const start = () => {
        if (text.length <= CHARS) { renderText(lcd, text.padEnd(CHARS, " ")); return; }
        const tape = `${text}    `;
        let offset = 0;
        const step = () => {
          const window = (tape + tape).slice(offset, offset + CHARS);
          renderText(lcd, window);
          const pause = offset === 0 ? 1400 : 230;
          offset = (offset + 1) % tape.length;
          scrollTimer = setTimeout(step, pause);
        };
        step();
      };
      if (flicker) {
        screen.classList.add("flicker");
        renderText(lcd, "");
        scrollTimer = setTimeout(() => { screen.classList.remove("flicker"); start(); }, 90);
      } else start();
    }

    function setOpen(next) {
      if (next === open) return;
      open = next;
      mainBtn.setAttribute("aria-expanded", String(open));
      mainBtn.setAttribute("aria-label", open ? "Turn off awards" : "Turn on awards");
      trigger.classList.toggle("on", open);
      trigger.classList.add("touched");
      clearTimeout(scrollTimer);
      clearTimeout(bootTimer);
      if (open) {
        device.hidden = false;
        position();
        requestAnimationFrame(() => device.classList.add("open"));
        // Power-on self test: every segment lights up, then the first award
        screen.classList.add("boot");
        renderText(lcd, "8".repeat(CHARS));
        lcd.querySelectorAll('.at-lit [data-s="14"]').forEach((dp) => dp.classList.add("on"));
        jury.classList.add("on");
        bootTimer = setTimeout(() => {
          screen.classList.remove("boot");
          lcd.querySelectorAll('.at-lit [data-s="14"]').forEach((dp) => dp.classList.remove("on"));
          show(index, { flicker: true });
        }, 520);
        setTimeout(() => device.querySelector(".at-button--small[data-dir='1']").focus({ preventScroll: true }), 60);
      } else {
        screen.classList.add("off");
        renderText(lcd, "");
        jury.classList.remove("on");
        device.classList.remove("open");
        bootTimer = setTimeout(() => {
          device.hidden = true;
          screen.classList.remove("off");
        }, 260);
      }
    }

    // Press feedback that works for mouse, touch and keyboard
    function press(btn) {
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 140);
    }

    mainBtn.addEventListener("click", () => setOpen(!open));
    device.querySelectorAll("[data-dir]").forEach((btn) =>
      btn.addEventListener("click", () => { press(btn); show(index + Number(btn.dataset.dir)); }),
    );
    device.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { show(index + 1); press(device.querySelector("[data-dir='1']")); }
      if (e.key === "ArrowLeft") { show(index - 1); press(device.querySelector("[data-dir='-1']")); }
      if (e.key === "Escape") { setOpen(false); mainBtn.focus({ preventScroll: true }); }
    });
    document.addEventListener("pointerdown", (e) => {
      if (open && !device.contains(e.target) && !trigger.contains(e.target)) setOpen(false);
    });

    // ---------- positioning: button in the block's corner, device hangs below it ----------
    let lastKey = "";
    function position() {
      const b = mainBtn.getBoundingClientRect();
      const mobile = innerWidth < 810;
      const width = Math.min(320, innerWidth - 24);
      device.style.width = `${width}px`;
      const top = b.bottom + scrollY + 16;
      let left = mobile ? (innerWidth - width) / 2 + scrollX : b.right + scrollX - width;
      left = Math.max(12 + scrollX, left);
      device.style.left = `${left}px`;
      device.style.top = `${top}px`;
      device.style.setProperty("--origin-x", `${b.left + b.width / 2 + scrollX - left}px`);
    }

    function sync() {
      const el = active() ? getBlock() : null;
      if (!el) {
        if (!trigger.hidden) { trigger.hidden = true; setOpen(false); }
      } else {
        const r = el.getBoundingClientRect();
        const mobile = innerWidth < 810;
        const insetX = mobile ? 64 : 100;
        const insetY = mobile ? 62 : 90;
        const size = trigger.offsetWidth || 66;
        const left = r.right + scrollX - insetX - size / 2;
        const top = r.top + scrollY + insetY - size / 2;
        const opacity = getComputedStyle(el).opacity;
        const key = `${left}|${top}|${opacity}|${innerWidth}`;
        if (key !== lastKey) {
          trigger.style.left = `${left}px`;
          trigger.style.top = `${top}px`;
          trigger.style.opacity = opacity;
          lastKey = key;
          if (open) position();
        }
        if (trigger.hidden) trigger.hidden = false;
      }
      requestAnimationFrame(sync);
    }

    document.body.appendChild(trigger);
    document.body.appendChild(device);
    renderText(lcd, "");
    requestAnimationFrame(sync);
    return { setOpen, show: (i) => show(i), next: () => show(index + 1) };
  }

  window.AwardsTuner = { mount, awards: AWARDS };
})();
