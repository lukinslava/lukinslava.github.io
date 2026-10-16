// Draft homepage: a private copy of the built homepage, where the redesign is tried before it reaches the real one.
// It gets its own copies of the homepage module and script_main, so nothing done here touches the live page.
// Not linked anywhere, not in the sitemap, noindex. The repository is public, so this hides the page, it doesn't lock it.
//
// Changes for the draft only go below: CSS on top of the homepage, and find/replace edits on the draft's HTML and
// page module (keep the two in step, or React rehydrates the old content). Each edit must match, like in content.mjs.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const DRAFT_PAGE = "home-next";

export const draftStyle = [];

/** @type {{label: string, html?: [string, string][], js?: [string, string][]}[]} */
export const draftEdits = [];

function swap(text, [find, replace], label) {
  const hits = text.split(find).length - 1;
  if (!hits) throw new Error(`draft: "${find}" not found (${label})`);
  return text.split(find).join(replace);
}

const rename = (name, text) => {
  const m = name.match(/^(.+)\.[A-Za-z0-9_-]+\.mjs$/);
  const hash = crypto.createHash("sha256").update("draft\0" + text).digest("base64url").slice(0, 8);
  return `${m[1]}.${hash}.mjs`;
};

/** @param {string} out the built site (docs/) */
export async function buildDraft(out) {
  const jsDir = path.join(out, "assets/js");
  let html = await fs.readFile(path.join(out, "index.html"), "utf8");

  const mainName = html.match(/script_main\.[A-Za-z0-9_-]+\.mjs/)?.[0];
  if (!mainName) throw new Error("draft: script_main not found in index.html");
  // Look only at the modules the live homepage preloads, so an earlier draft copy is never picked up.
  const preloaded = [...new Set(html.match(/[A-Za-z0-9_.-]+\.mjs/g))];
  const find = async (test, label) => {
    const hits = [];
    for (const f of preloaded) {
      const t = await fs.readFile(path.join(jsDir, f), "utf8").catch(() => null);
      if (t && test(t)) hits.push(f);
    }
    if (hits.length !== 1) throw new Error(`draft: expected one ${label}, found ${hits.length}`);
    return hits[0];
  };
  const homeName = await find((t) => t.includes("children:`Cases`"), "homepage module");
  // The page metadata module: Framer resets <title> and robots from it after hydration.
  const metaName = await find((t) => t.includes("serializationId:`framer-pzIB3`") && t.includes("robots:`"), "metadata module");
  let meta = await fs.readFile(path.join(jsDir, metaName), "utf8");
  meta = swap(meta, ["robots:`max-image-preview:large`", "robots:`noindex, nofollow`"], "metadata robots");
  meta = swap(meta, ["title:t(e,n).title||`Home`", "title:`Lukin Slava — draft`"], "metadata title");
  const draftMeta = rename(metaName, meta);

  let home = await fs.readFile(path.join(jsDir, homeName), "utf8");
  home = swap(home, [metaName, draftMeta], "module → draft metadata");
  for (const e of draftEdits) for (const pair of e.js ?? []) home = swap(home, pair, e.label);
  const draftHome = rename(homeName, home);

  let main = await fs.readFile(path.join(jsDir, mainName), "utf8");
  main = swap(main, [homeName, draftHome], "script_main → draft module");
  const draftMain = rename(mainName, main);
  main = main.split(mainName).join(draftMain);

  html = swap(html, [homeName, draftHome], "page → draft module");
  html = swap(html, [metaName, draftMeta], "page → draft metadata");
  html = swap(html, [mainName, draftMain], "page → draft script_main");
  html = swap(html, ['<meta name="robots" content="max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">'], "noindex");
  html = swap(html, ["<title>Lukin Slava</title>", "<title>Lukin Slava — draft</title>"], "title");
  for (const e of draftEdits) for (const pair of e.html ?? []) html = swap(html, pair, e.label);
  if (draftStyle.length) html = swap(html, ["</head>", `<style data-draft>${draftStyle.join("\n")}</style></head>`], "draft style");

  await fs.writeFile(path.join(jsDir, draftMeta), meta);
  await fs.writeFile(path.join(jsDir, draftHome), home);
  await fs.writeFile(path.join(jsDir, draftMain), main);
  await fs.writeFile(path.join(out, `${DRAFT_PAGE}.html`), html);
  return { page: `${DRAFT_PAGE}.html`, modules: [draftMeta, draftHome, draftMain] };
}
