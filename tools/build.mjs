// Builds a self-contained static site in ./docs from the mirrored Framer export in ./raw.
// Usage: SITE_URL=https://example.com node tools/build.mjs
//
// What it does:
//  - copies every mirrored file to /assets/... and rewrites all Framer CDN / Google Fonts URLs to local paths
//  - downloads the downscaled image variants the Framer runtime may request (…​.sd512.png etc.)
//  - patches the Framer runtime so responsive images, fonts and image preloading work with local URLs
//  - removes the "Made in Framer" badge, Framer analytics and the Framer on-page editor bar
import fs from "node:fs/promises";
import path from "node:path";

const RAW = path.resolve("raw");
const OUT = path.resolve("docs");
const OLD_ORIGIN = "https://slavalukin.framer.website";
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const PAGES = ["index.html", "lead-case.html", "process.html", "mind-case.html", "autodraw.html"];
const URL_RE = /https:\/\/(?:framerusercontent\.com|fonts\.gstatic\.com)\/[^\s"'`()<>\\,]+/g;
const SCALE_STEPS = [512, 1024, 2048, 4096]; // must match the runtime's list

const manifest = JSON.parse(await fs.readFile(path.join(RAW, "manifest.json"), "utf8"));

// ---------- URL mapping ----------

function splitExt(p) {
  const ext = path.posix.extname(p);
  return [p.slice(0, p.length - ext.length), ext];
}

/** Maps a remote URL to a local absolute path (without query). */
function localPath(u) {
  const url = new URL(u.replace(/&amp;/g, "&"));
  const p = url.pathname;
  if (url.host === "fonts.gstatic.com") return "/assets/fonts" + p.replace(/^\/s/, "");
  let m;
  if ((m = p.match(/^\/sites\/icons\/(.+)$/))) return "/assets/icons/" + m[1];
  if ((m = p.match(/^\/sites\/[^/]+\/(.+)$/))) return "/assets/js/" + m[1];
  if ((m = p.match(/^\/images\/(.+)$/))) {
    const sd = url.searchParams.get("scale-down-to");
    const [base, ext] = splitExt(m[1]);
    return "/assets/images/" + (sd ? `${base}.sd${sd}${ext}` : m[1]);
  }
  if ((m = p.match(/^\/assets\/(.+)$/))) return "/assets/files/" + m[1];
  if ((m = p.match(/^\/third-party-assets\/(.+)$/))) return "/assets/third-party/" + m[1];
  return "/assets/misc" + p;
}

/** Rewrites a remote URL (as it appears in text) to the local URL, preserving harmless query params. */
function rewriteUrl(match) {
  const escaped = match.includes("&amp;");
  const url = new URL(match.replace(/&amp;/g, "&"));
  const local = localPath(url.href);
  url.searchParams.delete("scale-down-to");
  let out = local + (url.search && url.host === "framerusercontent.com" ? url.search : "");
  return escaped ? out.replace(/&/g, "&amp;") : out;
}

function rewriteText(text) {
  return text.replace(URL_RE, (m) => {
    // The runtime lists a few npm source paths as plain strings; leave anything we never downloaded alone.
    // Prefix strings (ending in "/") are used for host checks, not as resources.
    if (/\/node_modules\//.test(m) || m.endsWith("/")) return m;
    return rewriteUrl(m);
  });
}

// ---------- helpers ----------

function replaceOnce(text, search, replacement, label) {
  const count = typeof search === "string" ? text.split(search).length - 1 : (text.match(new RegExp(search.source, search.flags.replace("g", "") + "g")) || []).length;
  if (count !== 1) throw new Error(`Patch "${label}" expected 1 match, found ${count}`);
  return text.replace(search, replacement);
}

async function write(rel, data) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

function imageSize(buf) {
  if (buf.slice(1, 4).toString() === "PNG") return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf.slice(0, 3).toString() === "GIF") return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      }
      i += 2 + len;
    }
  }
  if (buf.slice(8, 12).toString() === "WEBP") {
    const chunk = buf.slice(12, 16).toString();
    if (chunk === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
    if (chunk === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
    if (chunk === "VP8L") { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
  }
  if (/<svg/i.test(buf.slice(0, 500).toString())) return null;
  return null;
}

// ---------- build ----------

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

// 1. Copy mirrored assets (rewriting URLs inside text files).
const originals = new Map(); // local image path -> raw file of the full-size image
for (const [u, info] of Object.entries(manifest)) {
  if (!info.file || info.status !== 200 || u.endsWith("/")) continue;
  const host = new URL(u).host;
  if (host !== "framerusercontent.com" && host !== "fonts.gstatic.com") continue;
  const dest = localPath(u);
  const src = path.join(RAW, info.file);
  if (/\.(m?js|json|css)$/.test(dest)) {
    await write(dest, rewriteText(await fs.readFile(src, "utf8")));
  } else {
    await write(dest, await fs.readFile(src));
  }
  if (dest.startsWith("/assets/images/") && !/\.sd\d+\.\w+$/.test(dest)) originals.set(dest, src);
}

// 2. Make sure every downscaled variant the runtime can ask for exists locally.
for (const [dest, src] of originals) {
  const size = imageSize(await fs.readFile(src));
  if (!size) continue;
  const maxSide = Math.max(...size);
  for (const step of SCALE_STEPS) {
    if (step >= maxSide) break;
    const [base, ext] = splitExt(dest);
    const variant = `${base}.sd${step}${ext}`;
    const variantFile = path.join(OUT, variant);
    try { await fs.access(variantFile); continue; } catch {}
    const rawVariant = path.join(RAW, "framerusercontent.com/images", path.posix.basename(variant));
    let buf = await fs.readFile(rawVariant).catch(() => null);
    if (!buf) {
      const remote = `https://framerusercontent.com/images/${path.posix.basename(dest)}?scale-down-to=${step}`;
      const res = await fetch(remote);
      if (!res.ok) throw new Error(`Failed to fetch ${remote}: ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(rawVariant, buf);
    }
    await write(variant, buf);
    console.log("fetched variant", variant);
  }
}

// 3. Patch the Framer runtime.
const jsDir = path.join(OUT, "assets/js");
const jsFiles = await fs.readdir(jsDir);
const framerFile = path.join(jsDir, jsFiles.find((f) => /^framer\.[\w-]+\.mjs$/.test(f)));
const mainFile = path.join(jsDir, jsFiles.find((f) => /^script_main\.[\w-]+\.mjs$/.test(f)));

let framer = await fs.readFile(framerFile, "utf8");
// Responsive images: map scale-down-to=N onto pre-downloaded "name.sdN.ext" files.
framer = replaceOnce(
  framer,
  /function (\w+)\(e,t\)\{try\{let n=new URL\(e\);return t\?n\.searchParams\.set\(`scale-down-to`,`\$\{t\}`\):n\.searchParams\.delete\(`scale-down-to`\),n\.toString\(\)\}catch\{return e\}\}/,
  (_, name) =>
    `function ${name}(e,t){try{let n=new URL(e,location.href);if(n.origin===location.origin&&n.pathname.startsWith(\`/assets/images/\`)){n.pathname=n.pathname.replace(/\\.sd\\d+(\\.\\w+)$/,\`$1\`);t&&(n.pathname=n.pathname.replace(/(\\.\\w+)$/,\`.sd\${t}$1\`));n.searchParams.delete(\`scale-down-to\`);return n.pathname+n.search}return t?n.searchParams.set(\`scale-down-to\`,\`\${t}\`):n.searchParams.delete(\`scale-down-to\`),n.toString()}catch{return e}}`,
  "responsive image variants",
);
framer = replaceOnce(framer, "let n=new URL(t.src);return n.searchParams.delete(`scale-down-to`)", "let n=new URL(t.src,location.href);return n.searchParams.delete(`scale-down-to`)", "image srcset relative url");
framer = replaceOnce(framer, "try{new URL(e);let r=new Image", "try{new URL(e,location.href);let r=new Image", "image preload relative url");
// Font source detection (affects generated font-family names).
framer = replaceOnce(framer, "e.url.startsWith(`https://fonts.gstatic.com/s/`)?`google`", "(e.url.startsWith(`https://fonts.gstatic.com/s/`)||e.url.startsWith(`/assets/fonts/`))?`google`", "google font detection");
framer = replaceOnce(framer, "e.url.startsWith(`https://framerusercontent.com/third-party-assets/fontshare/`)?`fontshare`", "(e.url.startsWith(`https://framerusercontent.com/third-party-assets/fontshare/`)||e.url.startsWith(`/assets/third-party/fontshare/`))?`fontshare`", "fontshare font detection");
await fs.writeFile(framerFile, framer);

let main = await fs.readFile(mainFile, "utf8");
main = replaceOnce(main, /EditorBar:c===void 0\?void 0:\(\(\)=>\{.*?\}\)\(\),adaptLayoutToTextDirection/, "EditorBar:void 0,adaptLayoutToTextDirection", "remove editor bar");
main = replaceOnce(main, /\(function\(\)\{J&&l\(\(\)=>\{v\(document\.getElementById\(`__framer-badge-container`\),.*?\)\}\)\}\)\(\)/, "", "remove badge");
main = main.replaceAll(OLD_ORIGIN, SITE_URL);
await fs.writeFile(mainFile, main);

// Icon libraries (Iconoir / Hero icons) lazy-load each icon from framer.com/m/<lib>/<Name>.js@<version>.
// Download the icons the site actually uses and load them from /assets/icon-libs/<lib>/<Name>.js instead.
{
  const allJs = await Promise.all(jsFiles.filter((f) => f.endsWith(".mjs")).map(async (f) => [f, await fs.readFile(path.join(jsDir, f), "utf8")]));
  const usedNames = new Set(["Home"]);
  for (const [, text] of allJs) for (const m of text.matchAll(/iconSelection:`(\w+)`/g)) usedNames.add(m[1]);
  for (let [file, text] of allJs) {
    const libs = [...text.matchAll(/(\w+)=`https:\/\/framer\.com\/m\/([\w-]+)\/`/g)];
    if (!libs.length) continue;
    for (const [, varName, lib] of libs) {
      const importRe = new RegExp("import\\(`\\$\\{" + varName + "\\}\\$\\{(\\w+)\\}\\.js@([\\d.]+)`\\)");
      const im = text.match(importRe);
      if (!im) throw new Error(`No icon import found for ${lib} in ${file}`);
      const version = im[2];
      text = text.replace(importRe, "import(`${" + varName + "}${" + im[1] + "}.js`)");
      text = text.replace(`${varName}=\`https://framer.com/m/${lib}/\``, `${varName}=\`/assets/icon-libs/${lib}/\``);
      const cacheDir = path.join(RAW, "icon-libs", lib);
      await fs.mkdir(cacheDir, { recursive: true });
      for (const name of usedNames) {
        const cached = path.join(cacheDir, `${name}.js`);
        let code = await fs.readFile(cached, "utf8").catch(() => null);
        if (code === null) {
          const stub = await fetch(`https://framer.com/m/${lib}/${name}.js@${version}`);
          if (!stub.ok) continue; // icon doesn't exist in this library
          const target = (await stub.text()).match(/from "(https:\/\/framerusercontent\.com\/modules\/[^"]+)"/);
          if (!target) continue;
          code = await (await fetch(target[1])).text();
          await fs.writeFile(cached, code);
        }
        if (/from\s*["']https?:/.test(code)) throw new Error(`Icon ${lib}/${name} has external imports`);
        await write(`/assets/icon-libs/${lib}/${name}.js`, code);
      }
    }
    await fs.writeFile(path.join(jsDir, file), text);
  }
}

// 4. Pages.
function removeBadgeMarkup(html) {
  const start = html.indexOf('<div id="__framer-badge-container">');
  if (start === -1) return html;
  let depth = 0;
  const re = /<(\/?)div\b[^>]*>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + html.slice(re.lastIndex);
  }
  throw new Error("Unbalanced badge markup");
}

for (const page of PAGES) {
  let html = await fs.readFile(path.join(RAW, page), "utf8");
  html = removeBadgeMarkup(html);
  html = replaceOnce(html, /<script async src="https:\/\/events\.framer\.com\/script[^>]*><\/script>/, "", `${page}: analytics`);
  html = replaceOnce(html, /<script>try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)\).*?<\/script>/, "", `${page}: editor bar preload`);
  html = html.replace(/<meta name="generator" content="Framer[^"]*">/, "");
  html = html.replace(/<!-- Made in Framer[^>]*-->/g, "");
  if (SITE_URL) {
    html = html.replaceAll(OLD_ORIGIN, SITE_URL);
  } else {
    html = html.replace(/<link rel="canonical"[^>]*>/, "").replace(/<meta property="og:url"[^>]*>/, "");
  }
  html = rewriteText(html);
  const leftovers = html.match(/https:\/\/(framerusercontent\.com|events\.framer\.com|[\w.]*framer\.website)[^"'\s]*/g);
  if (leftovers) throw new Error(`${page}: unreplaced URLs ${leftovers.slice(0, 5).join(", ")}`);
  await write(page, html);
}

// 5. Sitemap / robots / 404 / GitHub Pages marker.
if (SITE_URL) {
  const urls = PAGES.map((p) => `<url><loc>${SITE_URL}/${p === "index.html" ? "" : p.replace(/\.html$/, "")}</loc></url>`).join("\n");
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}
await write("404.html", await fs.readFile(path.resolve("tools/404.html")));
await write(".nojekyll", "");
if (process.env.CNAME) await write("CNAME", process.env.CNAME + "\n");

console.log("Built", OUT);
