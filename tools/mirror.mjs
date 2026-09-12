// Mirrors the published Framer site into ./raw (untouched copies of every file).
// Usage: node tools/mirror.mjs
import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://slavalukin.framer.website";
const PAGES = ["/", "/lead-case", "/process", "/mind-case", "/autodraw"];
const RAW = path.resolve("raw");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

// Hosts whose files we copy locally. Everything else stays an external link.
const MIRROR_HOSTS = ["framerusercontent.com", "fonts.gstatic.com"];
const URL_RE = /https:\/\/(?:framerusercontent\.com|fonts\.gstatic\.com)\/[^\s"'`()<>\\,]+/g;
const REL_IMPORT_RE = /["'`](\.\.?\/[^"'`\s]+\.m?js)["'`]/g;
const TEXT_EXT = /\.(m?js|json|css|html|svg)$/i;

const seen = new Set();
const queue = [];
const manifest = {};

function localPathFor(u) {
  const url = new URL(u);
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith("/")) p += "index";
  return path.join(RAW, url.host, p);
}

function enqueue(u) {
  const clean = u.replace(/&amp;/g, "&");
  const key = clean; // query matters for images (scale-down-to variants)
  if (seen.has(key)) return;
  if (clean.endsWith(".map")) return;
  seen.add(key);
  queue.push(clean);
}

async function fetchWithRetry(u, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(u, { headers: { "user-agent": UA } });
      return res;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function scan(text, baseUrl) {
  for (const m of text.matchAll(URL_RE)) enqueue(m[0]);
  if (/\.m?js$/.test(new URL(baseUrl).pathname)) {
    for (const m of text.matchAll(REL_IMPORT_RE)) enqueue(new URL(m[1], baseUrl).href);
  }
}

async function processUrl(u) {
  const url = new URL(u);
  const res = await fetchWithRetry(u);
  if (!res.ok) {
    manifest[u] = { status: res.status };
    console.warn("!!", res.status, u);
    return;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // Variants with query strings are stored next to the original with a suffix.
  let file = localPathFor(u);
  if (url.search) {
    const sd = url.searchParams.get("scale-down-to");
    const ext = path.extname(file);
    file = sd ? file.slice(0, -ext.length) + `.sd${sd}` + ext : file;
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
  manifest[u] = { status: res.status, file: path.relative(RAW, file), bytes: buf.length, type: res.headers.get("content-type") };
  if (TEXT_EXT.test(url.pathname) || /text|javascript|json/.test(res.headers.get("content-type") || "")) {
    scan(buf.toString("utf8"), u);
  }
}

async function main() {
  await fs.mkdir(RAW, { recursive: true });
  for (const p of PAGES) {
    const u = SITE + p;
    const res = await fetchWithRetry(u);
    const html = await res.text();
    const name = p === "/" ? "index.html" : p.slice(1) + ".html";
    await fs.writeFile(path.join(RAW, name), html);
    manifest[u] = { status: res.status, file: name };
    scan(html, u);
  }
  // 404 page
  {
    const res = await fetchWithRetry(SITE + "/__definitely_missing__");
    await fs.writeFile(path.join(RAW, "404.html"), await res.text());
  }

  const CONCURRENCY = 8;
  let active = 0, done = 0;
  await new Promise((resolve) => {
    const pump = () => {
      if (queue.length === 0 && active === 0) return resolve();
      while (active < CONCURRENCY && queue.length) {
        const u = queue.shift();
        active++;
        processUrl(u)
          .catch((e) => console.warn("ERR", u, e.message))
          .finally(() => { active--; done++; if (done % 25 === 0) console.log("downloaded", done); pump(); });
      }
    };
    pump();
  });

  await fs.writeFile(path.join(RAW, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("total urls:", Object.keys(manifest).length);
}

main();
