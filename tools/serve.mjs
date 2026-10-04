// Local preview that behaves like GitHub Pages: /page -> page.html, 404.html for unknown paths.
// Usage: node tools/serve.mjs [port] [root]   (root defaults to docs/, e.g. `node tools/serve.mjs 4100 prototypes`)
// INJECT=a.css,b.js appends extra files to every served HTML page (for trying prototypes on the real site).
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.argv[3] || "docs");
const PORT = Number(process.argv[2] || process.env.PORT || 4000);
const INJECT = (process.env.INJECT || "").split(",").filter(Boolean).map((f) => path.resolve(f));
const injectTags = INJECT.map((f) => {
  const url = `/__inject/${path.basename(f)}`;
  return f.endsWith(".css") ? `<link rel="stylesheet" href="${url}" data-inject>` : `<script src="${url}" defer data-inject></script>`;
}).join("");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript",
  ".json": "application/json", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain",
};

async function tryFile(p) {
  try { const s = await fs.stat(p); return s.isFile() ? p : null; } catch { return null; }
}

http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const injected = INJECT.find((f) => pathname === `/__inject/${path.basename(f)}`);
  if (injected) {
    const body = await fs.readFile(injected);
    res.writeHead(200, { "content-type": TYPES[path.extname(injected)] || "text/plain", "cache-control": "no-store" });
    return res.end(body);
  }
  const base = path.join(ROOT, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  const file = (await tryFile(base)) || (await tryFile(base + ".html")) || (await tryFile(path.join(base, "index.html")));
  const status = file ? 200 : 404;
  const target = file || (await tryFile(path.join(ROOT, "404.html")));
  if (!target) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
  let data = await fs.readFile(target);
  const type = TYPES[path.extname(target)] || "application/octet-stream";
  if (injectTags && type.startsWith("text/html")) data = Buffer.from(data.toString().replace("</head>", `${injectTags}</head>`));
  // Videos need range support for seeking in some browsers.
  const range = req.headers.range;
  if (range && status === 200 && type === "video/mp4") {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s), end = e ? Number(e) : data.length - 1;
    res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${data.length}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
    return res.end(data.subarray(start, end + 1));
  }
  res.writeHead(status, { "content-type": type, "content-length": data.length });
  res.end(data);
}).listen(PORT, () => console.log(`Serving ${path.relative(process.cwd(), ROOT)}/ at http://localhost:${PORT}`));
