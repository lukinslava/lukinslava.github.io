// Content edits applied on top of the Framer mirror at build time.
// Page text lives in several places (server HTML, the page's JS module, the search index),
// so every edit is applied to all of them. Each edit must match at least once or the build fails.
export const contentEdits = [
  // Experience: Aleria -> Pragmatica
  { label: "experience company", find: "Aleria", replace: "Pragmatica" },
  { label: "experience role", find: "Chief of Design", replace: "Design lead outstaff unit" },
  {
    label: "experience description",
    find: [
      'Sovereign big data and <br class="framer-text">C-Level AI solution', // HTML
      /children:\[`Sovereign big data and `,\w+\(`br`,\{\}\),`C-Level AI solution`\]/, // JS module
      '"Sovereign big data and C-Level AI solution",', // search index
    ],
    replace: ["", "children:``", ""],
  },
  { label: "experience dates", find: "Sep 2025 - still working", replace: "Dec 2025 — still working" },
];

export function applyContentEdits(text, counts) {
  for (const edit of contentEdits) {
    const finds = Array.isArray(edit.find) ? edit.find : [edit.find];
    const replaces = Array.isArray(edit.replace) ? edit.replace : finds.map(() => edit.replace);
    finds.forEach((find, i) => {
      const re = typeof find === "string" ? new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : new RegExp(find.source, "g");
      text = text.replace(re, () => {
        counts[edit.label] = (counts[edit.label] || 0) + 1;
        return replaces[i];
      });
    });
  }
  return text;
}
