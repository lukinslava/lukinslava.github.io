// Content edits applied on top of the Framer mirror at build time.
// Page text lives in several places (server HTML, the page's JS module, the search index),
// so every edit is applied to all of them. Each edit must match at least once or the build fails.
export const contentEdits = [
  // Experience: Aleria -> Pragmatica
  { label: "experience company", find: "Aleria", replace: "Pragmatica" },
  { label: "experience role", find: "Chief of Design", replace: "Outstaff Design Lead" },
  {
    label: "experience description",
    find: [
      'Sovereign big data and <br class="framer-text">C-Level AI solution', // HTML
      /children:\[`Sovereign big data and `,(\w+)\(`br`,\{\}\),`C-Level AI solution`\]/, // JS module
      '"Sovereign big data and C-Level AI solution"', // search index
    ],
    replace: [
      'Matching and growing <br class="framer-text">designers of all profiles <br class="framer-text">for big tech and startups',
      (_, br) => `children:[\`Matching and growing \`,${br}(\`br\`,{}),\`designers of all profiles \`,${br}(\`br\`,{}),\`for big tech and startups\`]`,
      '"Matching and growing designers of all profiles for big tech and startups"',
    ],
  },
  { label: "experience dates", find: "Sep 2025 - still working", replace: "Dec 2025 — still working" },

  // Em dashes instead of spaced hyphens
  { label: "looch description dash", find: "Product studio - #1 UX", replace: "Product studio — #1 UX" },
  { label: "looch dates dash", find: "Nov 2023 - Oct 2025", replace: "Nov 2023 — Oct 2025" },
  { label: "ring central dates dash", find: "Dec 2021 - July 2023", replace: "Dec 2021 — July 2023" },
];

// CSS appended to every page's <head>. !important so it also wins over the CSS Framer injects on client-side navigation.
export const styleOverrides = [
  // Experience cards: Framer clips the text stacks (overflow: hidden) exactly at the last line box,
  // and with line-height 1em descenders on the last line ("g" in "big") get cut off.
  ".framer-1gtkbji, .framer-18a0lfp, .framer-1n7e9z2, .framer-13cru1x, .framer-1pcs9tt, .framer-1pf0meu { overflow: visible !important; }",
];

export function applyContentEdits(text, counts) {
  for (const edit of contentEdits) {
    const finds = Array.isArray(edit.find) ? edit.find : [edit.find];
    const replaces = Array.isArray(edit.replace) ? edit.replace : finds.map(() => edit.replace);
    finds.forEach((find, i) => {
      const re = typeof find === "string" ? new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : new RegExp(find.source, "g");
      text = text.replace(re, (...match) => {
        counts[edit.label] = (counts[edit.label] || 0) + 1;
        return typeof replaces[i] === "function" ? replaces[i](...match) : replaces[i];
      });
    });
  }
  return text;
}
