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

  // Positioning: design leader
  { label: "hero title", find: "product design lead", replace: "design leader" },
  {
    label: "meta description",
    find: ['content="Product Design Lead "', "description:`Product Design Lead `", '"description":"Product Design Lead "'],
    replace: [
      'content="Design leader — Head of Design / Design Lead. Building design teams of up to 30 people and AI tools."',
      "description:`Design leader — Head of Design / Design Lead. Building design teams of up to 30 people and AI tools.`",
      '"description":"Design leader — Head of Design / Design Lead. Building design teams of up to 30 people and AI tools."',
    ],
  },
  { label: "summary scope", find: "Products and startups. B2B and B2C. ", replace: "Big tech and startups. B2B and B2C. " },
  { label: "summary team size", find: "Led a team of up to 29 people", replace: "Led teams of up to 30 designers" },
  {
    label: "summary about",
    find: "Built and led a team aligned with product needs. Skilled at bringing structure to complexity, planning workloads, and driving solutions in uncertain environments. Reliable, proactive, ",
    replace: "I build and grow design teams, products and companies. I set up processes that make designers stronger and tie design to business results. ",
  },
  { label: "summary about ending", find: "and accountable.", replace: "I also design and build AI tools myself." },

  // Core skills — column 1
  { label: "skills 1 heading", find: ["&amp; Organization", "& Organization"], replace: ["&amp; Scaling", "& Scaling"] },
  { label: "skills 1.1", find: "Building and scaling design teams", replace: "Building and scaling design teams of up to 30 people" },
  { label: "skills 1.2", find: "Mentorship, 1:1s, and career development", replace: "Matching, hiring and onboarding designers" },
  { label: "skills 1.3", find: "Resource planning and capacity management", replace: "Mentorship, 1:1s and career growth" },
  { label: "skills 1.4", find: "Shaping design culture and team rituals", replace: "Resource, budget and capacity planning" },
  { label: "skills 1.5", find: "Establishing design processes", replace: "Design culture, rituals and processes" },
  // Core skills — column 2
  { label: "skills 2 heading", find: ["&amp; Cross-functional Collaboration", "& Cross-functional Collaboration"], replace: ["&amp; Business Impact", "& Business Impact"] },
  {
    label: "skills 2.1",
    find: [
      'Close collaboration with Product <br class="framer-text">and Engineering', // HTML
      /children:\[`Close collaboration with Product `,\w+\(`br`,\{\}\),`and Engineering`\]/, // JS module
      "Close collaboration with Product and Engineering", // search index
    ],
    replace: ["Close partnership with Product and Engineering", "children:`Close partnership with Product and Engineering`", "Close partnership with Product and Engineering"],
  },
  { label: "skills 2.2", find: "Balancing user needs with business objectives", replace: "Tying design to metrics and business goals" },
  { label: "skills 2.3", find: "Driving product strategy through UX insights", replace: "Design systems and quality at scale" },
  // Core skills — column 3
  {
    label: "skills 3 heading",
    find: ['"Design Systems, UX & Visual Craft"', "Design Systems, ", "UX &amp; Visual Craft", "UX & Visual Craft"],
    replace: ['"AI Experiments & Building"', "AI Experiments ", "&amp; Building", "& Building"],
  },
  { label: "skills 3.1", find: "End-to-end design: research, UX/UI, prototyping", replace: "Designing AI-powered products and features" },
  { label: "skills 3.2", find: "Designing both complex B2B products and engaging B2C experiences", replace: "Building internal AI tools end-to-end" },
  { label: "skills 3.3", find: "Creating and scaling design systems", replace: "Prototyping and shipping with Claude and GitHub" },

  // Yandex Market case: 2 -> 5 designers
  {
    label: "yandex card number",
    find: ['class="framer-text">1+2</span>', "children:`1+2`", '"1+2 -> 5"'],
    replace: ['class="framer-text">2</span>', "children:`2`", '"2 -> 5"'],
  },
  { label: "yandex case title", find: "Growing from 3 to 5 Designers", replace: "Growing from 2 to 5 Designers" },

  // Search index for the homepage structure changes in tools/structure.mjs
  { label: "search index section heading", find: '"Cases"]', replace: '"Cases","AI & side projects"]' },
  {
    label: "search index card titles",
    find: '"82BOX","Hircost","Mindbox","Autodraw","OS Sunrice","Strana Development"]',
    replace: '"AUF Match","Aleria","Phygital+","Autodraw"]',
  },
  {
    label: "search index card descriptions",
    find: '"Retail Health and Personal Care Products","Medical Apparel E-commerce Store","A platform for omnichannel campaigns and personalized customer marketing","AI-powered feature for Whiteboard","An operating system for multitasking professionals","Online platform for real estate brokers"',
    replace:
      '"Internal AI tool at Pragmatica: screens 2,000+ designer portfolios and shortlists 30–60 per role","Side project · Head of Design for several products built on proprietary AI","Side project · Product designer, first-session experience for a generative AI workspace, 2024","AI shape recognition for the RingCentral whiteboard · ~$700K projected revenue"',
  },
  { label: "search index framer badge", find: ',"Create a free website with Framer, the website builder loved by startups, designers and agencies."', replace: "" },

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
  // Core skills cards: Framer pins the list to the bottom (space-between); with lists of different length
  // the third column's list floats far below its heading. Keep lists right under the headings instead.
  ".framer-1yijn1p, .framer-1k2wkeh, .framer-1sy1c41 { justify-content: flex-start !important; }",
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
