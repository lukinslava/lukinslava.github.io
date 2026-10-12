// Structural edits to the homepage (cards removed / repurposed, new section heading).
// Applied to the server HTML and to the page's JS module in the same way, so React hydration sees identical trees.
// Each operation locates its target by a unique Framer class name and fails loudly if it can't.

const SECTION_HEADING = "AI & side projects";

// Case cards are identified by their Framer class. Repurposed cards keep their layout and only change content.
export const cardEdits = [
  {
    cls: "framer-1fzv8qv", // was 82BOX
    href: ["https://82box.ru/", "./ai-match"],
    title: ["82BOX", "AI Match"],
    description: ["Retail Health and Personal Care Products", "Internal AI tool at Pragmatica: screens 2,000+ designer portfolios and shortlists 30–60 per role"],
    image: [/Z05mJp17Eq5RNItbzKiMZrmMDzo((?:\.sd\d+)?)\.png/g, "cover-auf-match$1.png"],
  },
  {
    cls: "framer-mrw84b", // was Hircost
    href: ["https://hircost.ru/", "https://aleria.ai/"],
    title: ["Hircost", "Aleria"],
    description: ["Medical Apparel E-commerce Store", "Side project · Head of Design for several products built on proprietary AI"],
    image: [/AsCizz3RvJC4LXlzp61BTewuuQE((?:\.sd\d+)?)\.png/g, "cover-aleria$1.png"],
  },
  {
    cls: "framer-154ggvo", // was Mindbox (Golden Site)
    href: ["https://goldensite.ru/work/best-design-company-services/10066/", "https://phygital.plus/"],
    title: ["Mindbox", "Phygital+"],
    description: ["A platform for omnichannel campaigns and personalized customer marketing", "Side project · Product designer, first-session experience for a generative AI workspace, 2024"],
    image: [/OF33UiE1CCHHL9bXH5X41yB74((?:\.sd\d+)?)\.gif/g, "cover-phygital$1.png"],
  },
  {
    cls: "framer-12djsav", // Autodraw
    description: ["AI-powered feature for Whiteboard", "AI shape recognition for the RingCentral whiteboard · ~$700K projected revenue"],
  },
];
export const removedCards = ["framer-lgdwa8" /* OS Sunrice */, "framer-1xhjtx5" /* Strana Development */];
// New cards: a copy of an existing card (`from`, already edited above) placed right after it, with its own content.
// Added last, so every lookup above still finds exactly one card per class. A video cover, if any, is laid over the
// image by tools/inject/card-video.js; the image here is its poster.
export const newCards = [
  {
    from: "framer-1fzv8qv", // AI Match
    nodeId: "nDuckCardX",
    // A full URL: Framer's Link sends "./…" and "/…" through its router, which knows only the Framer pages and turns
    // the rest into "./" once the card renders on the client, and it reads a bare "notch-duck" as a domain. AI Match
    // keeps "./ai-match" only because hydration leaves the server attribute alone; a copied card does not get that luck.
    href: ["./ai-match", "https://lukinslava.github.io/notch-duck"],
    title: ["AI Match", "Notch Duck"],
    description: ["Internal AI tool at Pragmatica: screens 2,000+ designer portfolios and shortlists 30–60 per role", "Side project · macOS notch app, designed and built with Claude Code"],
    image: [/cover-auf-match((?:\.sd\d+)?)\.png/g, "cover-notch-duck$1.jpg"],
  },
];
// The new section starts right before this card.
const SECTION_START_CARD = "framer-1fzv8qv";

// ---------- helpers ----------

function once(text, needle, label) {
  const i = text.indexOf(needle);
  if (i === -1 || text.indexOf(needle, i + 1) !== -1) throw new Error(`structure: expected exactly one "${needle}" (${label})`);
  return i;
}

function replaceInRange(text, start, end, fn) {
  return text.slice(0, start) + fn(text.slice(start, end)) + text.slice(end);
}

function mustReplace(segment, find, replace, label) {
  const hits = typeof find === "string" ? segment.split(find).length - 1 : (segment.match(find) || []).length;
  if (!hits) throw new Error(`structure: "${find}" not found (${label})`);
  return typeof find === "string" ? segment.split(find).join(replace) : segment.replace(find, replace);
}

// Index just past the parenthesis matching the "(" at `open`, skipping string and template literal contents.
function matchParen(src, open) {
  const stack = [];
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "'" || c === '"') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (c === "`") {
      i = skipTemplate(src, i);
    } else if (c === "(" || c === "{" || c === "[") {
      stack.push(c);
    } else if (c === ")" || c === "}" || c === "]") {
      stack.pop();
      if (stack.length === 0) return i + 1;
    }
  }
  throw new Error("structure: unbalanced expression");
}

function skipTemplate(src, start) {
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === "\\") { i++; continue; }
    if (src[i] === "`") return i;
    if (src[i] === "$" && src[i + 1] === "{") i = matchParen(src, i + 1) - 1;
  }
  throw new Error("structure: unterminated template literal");
}

// ---------- HTML ----------

function htmlCardRange(html, cls) {
  const start = once(html, `<!--$--><a class="${cls} framer-lux5qc"`, `html card ${cls}`);
  const closing = "</a><!--/$-->";
  const end = html.indexOf(closing, start) + closing.length;
  return [start, end];
}

const escapeHtml = (s) => s.replace(/&/g, "&amp;");

// The standalone Awards section (both breakpoint variants in the server HTML, one node in the page module).
const AWARDS_SECTION = "framer-1bt27sf";

function removeHtmlBlock(html, start) {
  const re = /<(\/?)div\b[^>]*>/g;
  re.lastIndex = start;
  let depth = 0;
  for (let m; (m = re.exec(html)); ) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + html.slice(re.lastIndex);
  }
  throw new Error("structure: unbalanced div");
}

export function applyHtmlStructure(html) {
  const variantRe = new RegExp(`<div class="ssr-variant[^"]*"><div class="${AWARDS_SECTION}"`);
  let removed = 0;
  for (let m; (m = html.match(variantRe)); removed++) html = removeHtmlBlock(html, m.index);
  if (removed !== 2) throw new Error(`structure: expected 2 awards section variants, removed ${removed}`);

  for (const cls of removedCards) {
    const [s, e] = htmlCardRange(html, cls);
    html = html.slice(0, s) + html.slice(e);
  }
  for (const edit of cardEdits) {
    const [s, e] = htmlCardRange(html, edit.cls);
    html = replaceInRange(html, s, e, (card) => {
      if (edit.href) card = mustReplace(card, `href="${edit.href[0]}"`, `href="${edit.href[1]}"`, `${edit.cls} href`);
      if (edit.title) card = mustReplace(card, `>${edit.title[0]}</h3>`, `>${escapeHtml(edit.title[1])}</h3>`, `${edit.cls} title`);
      if (edit.description) card = mustReplace(card, `>${edit.description[0]}</p>`, `>${escapeHtml(edit.description[1])}</p>`, `${edit.cls} description`);
      if (edit.image) card = mustReplace(card, edit.image[0], edit.image[1], `${edit.cls} image`);
      return card;
    });
  }
  // New section: close the cases grid, repeat the "Cases" heading with a new title, open a second grid.
  const headingEnd = once(html, ">Cases</h2></div>", "html cases heading") + ">Cases</h2></div>".length;
  const headingStart = html.lastIndexOf('<div class="framer-3evyfl"', headingEnd);
  const heading = html.slice(headingStart, headingEnd).replace(">Cases</h2>", `>${escapeHtml(SECTION_HEADING)}</h2>`);
  const [sectionStart] = htmlCardRange(html, SECTION_START_CARD);
  html = html.slice(0, sectionStart) + `</div>${heading}<div class="framer-ahfcuh">` + html.slice(sectionStart);
  return addHtmlCards(html);
}

export function addHtmlCards(html) {
  for (const card of newCards) {
    const [s, e] = htmlCardRange(html, card.from);
    let copy = html.slice(s, e);
    copy = mustReplace(copy, `href="${card.href[0]}"`, `href="${card.href[1]}"`, `${card.nodeId} href`);
    copy = mustReplace(copy, `>${escapeHtml(card.title[0])}</h3>`, `>${escapeHtml(card.title[1])}</h3>`, `${card.nodeId} title`);
    copy = mustReplace(copy, `>${escapeHtml(card.description[0])}</p>`, `>${escapeHtml(card.description[1])}</p>`, `${card.nodeId} description`);
    copy = mustReplace(copy, card.image[0], card.image[1], `${card.nodeId} image`);
    html = html.slice(0, e) + copy + html.slice(e);
  }
  return html;
}

// ---------- JS page module ----------

// Range of the Link(...) call that wraps the card with the given class.
function jsCardRange(js, cls) {
  const anchor = once(js, `className:\`${cls} framer-lux5qc\``, `js card ${cls}`);
  const linkRe = /\w+\(\w+,\{href:/g;
  let start = -1;
  for (let m; (m = linkRe.exec(js)) && m.index < anchor; ) start = m.index;
  if (start === -1) throw new Error(`structure: no link wrapper for ${cls}`);
  const end = matchParen(js, js.indexOf("(", start));
  if (end < anchor) throw new Error(`structure: link wrapper for ${cls} does not contain the card`);
  return [start, end];
}

export function applyJsStructure(js) {
  {
    const anchor = once(js, `className:\`${AWARDS_SECTION}\``, "js awards section");
    const re = /\w+\(\w+,\{breakpoint:\w+,overrides:/g;
    let start = -1;
    for (let m; (m = re.exec(js)) && m.index < anchor; ) start = m.index;
    const end = matchParen(js, js.indexOf("(", start));
    if (start === -1 || end < anchor) throw new Error("structure: awards section wrapper not found");
    if (js[start - 1] !== ",") throw new Error("structure: expected a comma before the awards section");
    js = js.slice(0, start - 1) + js.slice(end);
  }

  for (const cls of removedCards) {
    const [s, e] = jsCardRange(js, cls);
    if (js[s - 1] !== ",") throw new Error(`structure: expected a comma before card ${cls}`);
    js = js.slice(0, s - 1) + js.slice(e);
  }
  for (const edit of cardEdits) {
    const [s, e] = jsCardRange(js, edit.cls);
    js = replaceInRange(js, s, e, (card) => {
      if (edit.href) card = mustReplace(card, `href:\`${edit.href[0]}\``, `href:\`${edit.href[1]}\``, `${edit.cls} href`);
      if (edit.title) card = mustReplace(card, `children:\`${edit.title[0]}\``, `children:\`${edit.title[1]}\``, `${edit.cls} title`);
      if (edit.description) card = mustReplace(card, `children:\`${edit.description[0]}\``, `children:\`${edit.description[1]}\``, `${edit.cls} description`);
      if (edit.image) card = mustReplace(card, edit.image[0], edit.image[1], `${edit.cls} image`);
      return card;
    });
  }
  // New section (mirrors applyHtmlStructure).
  const casesText = once(js, "children:`Cases`", "js cases heading");
  const headingRe = /\w+\(\w+,\{__framer__animate:/g;
  let headingStart = -1;
  for (let m; (m = headingRe.exec(js)) && m.index < casesText; ) headingStart = m.index;
  const headingEnd = matchParen(js, js.indexOf("(", headingStart));
  if (headingEnd < casesText) throw new Error("structure: cases heading expression not found");
  const heading = js.slice(headingStart, headingEnd).replace("children:`Cases`", `children:\`${SECTION_HEADING}\``);
  const gridOpen = js.slice(headingEnd).match(/^,(\w+\(`div`,\{className:`framer-ahfcuh`,children:\[)/);
  if (!gridOpen) throw new Error("structure: cases grid not found after heading");
  const [sectionStart] = jsCardRange(js, SECTION_START_CARD);
  js = js.slice(0, sectionStart) + `]}),${heading},${gridOpen[1]}` + js.slice(sectionStart);
  return addJsCards(js);
}

export function addJsCards(js) {
  for (const card of newCards) {
    const [s, e] = jsCardRange(js, card.from);
    let copy = js.slice(s, e);
    copy = mustReplace(copy, /nodeId:`[^`]*`/, `nodeId:\`${card.nodeId}\``, `${card.nodeId} nodeId`);
    copy = mustReplace(copy, `href:\`${card.href[0]}\``, `href:\`${card.href[1]}\``, `${card.nodeId} href`);
    copy = mustReplace(copy, `children:\`${card.title[0]}\``, `children:\`${card.title[1]}\``, `${card.nodeId} title`);
    copy = mustReplace(copy, `children:\`${card.description[0]}\``, `children:\`${card.description[1]}\``, `${card.nodeId} description`);
    copy = mustReplace(copy, card.image[0], card.image[1], `${card.nodeId} image`);
    js = js.slice(0, e) + "," + copy + js.slice(e);
  }
  return js;
}
