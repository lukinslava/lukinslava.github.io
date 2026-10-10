// Снимки и проверки через headless Chrome по CDP. Встроенная панель браузера
// грузит страницы с visibilityState=hidden: Framer останавливает видео, а
// анимации появления выглядят сломанными — поэтому смотрим результат отсюда.
//
//   node tools/shot.mjs <url> page   <файл> [ширина] [масштаб] — вся страница полосами
//   node tools/shot.mjs <url> el     <селектор> <файл> [ширина] [масштаб]
//   node tools/shot.mjs <url> eval   '<выражение>' [ширина]    — вернуть JSON в консоль
//
// Примеры:
//   node tools/shot.mjs http://localhost:4000/ el ".framer-bvvzdt" /tmp/cases.png
//   node tools/shot.mjs http://localhost:4000/ eval "document.title"
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const [url, mode = "page", a1, a2, a3, a4] = process.argv.slice(2);
if (!url) {
  console.error("usage: node tools/shot.mjs <url> page|el|eval …");
  process.exit(1);
}
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9300 + Math.floor(Math.random() * 400);
const profile = await fs.mkdtemp(path.join(os.tmpdir(), "shot-"));
const chrome = spawn(CHROME, ["--headless=new", "--autoplay-policy=no-user-gesture-required", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });

for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(String(m.params.exceptionDetails.exception?.description).slice(0, 200));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((x) => x.value || x.description).join(" ").slice(0, 200));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression })).result?.result?.value;
const shot = async (clip) => Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip })).result.data, "base64");
/** Пройти страницу сверху вниз: Framer показывает блоки только когда они в кадре. */
const scrollThrough = () => ev(`(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
  scrollTo(0, 0); await new Promise((r) => setTimeout(r, 800));
  return document.body.scrollHeight;
})()`);

try {
  await send("Page.enable");
  await send("Runtime.enable");
  const width = Number(mode === "el" ? a3 ?? 1440 : mode === "eval" ? a2 ?? 1440 : a2 ?? 1440);
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Page.navigate", { url });
  await sleep(2500);

  if (mode === "eval") {
    console.log(JSON.stringify(await ev(a1), null, 1));
  } else if (mode === "el") {
    const scale = Number(a4 ?? 0.5);
    await scrollThrough();
    const box = await ev(`(async () => {
      const el = document.querySelector(${JSON.stringify(a1)});
      el.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 1200));
      const r = el.getBoundingClientRect();
      return { y: r.top + scrollY, h: r.height };
    })()`);
    await fs.writeFile(a2, await shot({ x: 0, y: box.y, width, height: box.h, scale }));
    console.log("saved", a2);
  } else {
    const scale = Number(a3 ?? 0.45);
    const height = await scrollThrough();
    const band = 1800;
    const base = a1.replace(/\.png$/, "");
    for (let y = 0, k = 0; y < height; y += band, k++) {
      await ev(`(async () => { scrollTo(0, ${y}); await new Promise((r) => setTimeout(r, 700)); })()`);
      await fs.writeFile(`${base}-${k}.png`, await shot({ x: 0, y, width, height: Math.min(band, height - y), scale }));
    }
    console.log("saved", `${base}-*.png`, "· page height", height);
  }
  console.log(errors.length ? errors.slice(0, 8) : "no page errors");
} finally {
  chrome.kill();
  // Chrome дописывает профиль уже после kill — чистим молча
  await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(0);
}
