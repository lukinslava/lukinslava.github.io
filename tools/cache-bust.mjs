// Renames JS modules whose content we changed, so browsers and the GitHub Pages CDN never pair a fresh page with a
// cached module under the same name (a new homepage hydrated by the old module drops the cards it doesn't know).
// Framer names modules "<name>.<hash>.mjs"; the hash part is replaced with one of our content. Every file that
// mentions a renamed module is rewritten, and a rewritten module is renamed in turn.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const TEXT = /\.(html|mjs|json)$/;

async function listFiles(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { recursive: true, withFileTypes: true })) {
    if (e.isFile() && TEXT.test(e.name)) out.push(path.join(e.parentPath ?? e.path, e.name));
  }
  return out;
}

/** @param {string} out the built site (docs/)  @param {string[]} changed paths of modules edited after mirroring */
export async function bustCache(out, changed) {
  const files = await listFiles(out);
  const queue = [...changed];
  const renamed = new Map(); // old file -> new file
  const done = new Set(); // new files, never renamed twice
  while (queue.length) {
    const file = queue.shift();
    if (renamed.has(file) || done.has(file)) continue;
    const name = path.basename(file);
    const m = name.match(/^(.+)\.[A-Za-z0-9_-]+\.mjs$/);
    if (!m) throw new Error(`cache-bust: unexpected module name ${name}`);
    const text = await fs.readFile(file, "utf8");
    const hash = crypto.createHash("sha256").update(text).digest("base64url").slice(0, 8);
    const next = `${m[1]}.${hash}.mjs`;
    const target = path.join(path.dirname(file), next);
    await fs.writeFile(target, text.split(name).join(next));
    if (target !== file) await fs.rm(file);
    renamed.set(file, target);
    done.add(target);
    const i = files.indexOf(file);
    if (i !== -1) files[i] = target;
    for (const other of files) {
      if (other === target) continue;
      const t = await fs.readFile(other, "utf8");
      if (!t.includes(name)) continue;
      await fs.writeFile(other, t.split(name).join(next));
      if (other.endsWith(".mjs") && !done.has(other)) queue.push(other);
    }
  }
  return [...renamed].map(([a, b]) => [path.basename(a), path.basename(b)]);
}
