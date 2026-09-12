// Renders typographic case covers (same style as the "Mindbox" / "2 -> 5" covers) with headless Chrome,
// plus the downscaled *.sdN.png variants the Framer runtime requests. Output: tools/images/.
// Usage: node tools/covers.mjs   (needs Google Chrome; run once after changing the list below)
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const covers = [
  { file: "cover-auf-match", text: "AUF Match", bg: "#f97029" },
  { file: "cover-aleria", text: "Aleria", bg: "#161616" },
  { file: "cover-phygital", text: "Phygital+", bg: "#2f6bff" },
];
// Card cover on desktop is 1291x700 CSS px; render at 2x. Text size matches the Mindbox cover (198px at 1291px).
const WIDTH = 2582;
const HEIGHT = 1400;
const FONT_PX = 396;
const STEPS = [512, 1024, 2048];

const OUT = path.resolve("tools/images");
const FONT = path.resolve("docs/assets/fonts/antonio/v22/gNMEW3NwSYq_9WD3yHQiFQ.woff2");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await fs.mkdir(OUT, { recursive: true });
const port = 9600 + Math.floor(Math.random() * 100);
const profile = await fs.mkdtemp(path.join((await import("node:os")).tmpdir(), "covers-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });
try {
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");

  const render = async (cover, width, height) => {
    const scale = width / WIDTH;
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    const html = `<!doctype html><style>
      @font-face { font-family: Antonio; src: url("file://${FONT}") format("woff2"); }
      html, body { margin: 0; width: ${width}px; height: ${height}px; }
      body { background: ${cover.bg}; display: grid; place-items: center; }
      p { margin: 0; font-family: Antonio; font-weight: 400; font-size: ${FONT_PX * scale}px; line-height: 1; color: #fff; }
    </style><p>${cover.text}</p>`;
    const file = path.join(profile, `${cover.file}.html`);
    await fs.writeFile(file, html);
    await send("Page.navigate", { url: `file://${file}` });
    await sleep(400);
    const ready = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: "document.fonts.ready.then(() => [...document.fonts].some(f => f.family === 'Antonio' && f.status === 'loaded'))" });
    if (!ready.result.result.value) throw new Error("Antonio font failed to load");
    const shot = await send("Page.captureScreenshot", { format: "png" });
    return Buffer.from(shot.result.data, "base64");
  };

  for (const cover of covers) {
    await fs.writeFile(path.join(OUT, `${cover.file}.png`), await render(cover, WIDTH, HEIGHT));
    for (const step of STEPS) {
      const w = step;
      const h = Math.round((HEIGHT / WIDTH) * step);
      await fs.writeFile(path.join(OUT, `${cover.file}.sd${step}.png`), await render(cover, w, h));
    }
    // The runtime may also ask for 4096 when it believes the source is larger; serve the full-size render.
    await fs.copyFile(path.join(OUT, `${cover.file}.png`), path.join(OUT, `${cover.file}.sd4096.png`));
    console.log("rendered", cover.file);
  }
  ws.close();
} finally {
  const exited = new Promise((r) => chrome.once("exit", r));
  chrome.kill();
  await exited;
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
