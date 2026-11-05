// ABOUTME: Renders every OPE specification version to HTML plus a nav tree, and says which is current.
// ABOUTME: The nav tree powers the expandable sidebar on the spec docs pages.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

function createSlugger() {
  const counts = {};
  return function slugify(text) {
    const clean = text.replace(/<[^>]+>/g, "");
    const base = clean
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    if (counts[base] === undefined) {
      counts[base] = 0;
      return base;
    }
    counts[base]++;
    return `${base}-${counts[base]}`;
  };
}

function renderSpec(mdPath) {
  const md = fs.readFileSync(mdPath, "utf-8");

  // Single slugger shared between renderer and nav extraction
  // to guarantee IDs match between sidebar links and heading anchors
  const slugify = createSlugger();
  const nav = [];
  let currentH2 = null;
  let seenTitle = false;

  const renderer = new marked.Renderer();
  renderer.heading = function ({ text, depth }) {
    const id = slugify(text);

    // The first h1 is the document title. Later h1s divide the
    // document into Parts and appear in the sidebar as group labels.
    const isPart = depth === 1 && seenTitle;
    if (depth === 1) seenTitle = true;

    // Build nav tree as we render (single pass)
    if (isPart) {
      nav.push({ id, text, children: [], part: true });
      currentH2 = null;
    } else if (depth === 2) {
      currentH2 = { id, text, children: [] };
      nav.push(currentH2);
    } else if (depth === 3 && currentH2) {
      currentH2.children.push({ id, text });
    }

    const cls = isPart ? "group spec-part" : "group";
    return `<h${depth} id="${id}" class="${cls}">
      ${text}
      <a href="#${id}" class="anchor-link" aria-hidden="true" tabindex="-1">#</a>
    </h${depth}>`;
  };

  // Key/value tables written with an empty header row (| | |) would
  // otherwise render a blank shaded header; drop it.
  const html = marked
    .parse(md, { renderer })
    .replace(/<thead>\s*<tr>(\s*<th(\s[^>]*)?>\s*<\/th>)+\s*<\/tr>\s*<\/thead>/g, "")
    // Code blocks scroll sideways; tabindex lets keyboard users scroll them too.
    .replace(/<pre>/g, '<pre tabindex="0">');

  return { html, nav, md };
}

// Which version /ope/spec/ shows. v0.2 is a proposed draft, open for public
// comment; when it is adopted, set CURRENT to "0.2" and PROPOSED to null.
const CURRENT = "0.1";
const PROPOSED = "0.2";
// Where comments on the proposed draft go: the call-for-comment issue, open
// until 2026-11-19.
const COMMENTS_URL = "https://github.com/shellen/open-portable-entitlement/issues/23";
const COMMENTS_UNTIL = "November 19, 2026";

const SOURCES = {
  "0.1": "archive/OPE-Specification-0.1.md",
  "0.2": "OPE-Specification.md",
};

export default function () {
  const versions = {};
  for (const [version, source] of Object.entries(SOURCES)) {
    versions[version] = { ...renderSpec(path.join(root, source)), version, source };
  }
  return {
    ...versions[CURRENT],
    current: CURRENT,
    proposed: PROPOSED,
    commentsUrl: COMMENTS_URL,
    commentsUntil: COMMENTS_UNTIL,
    versions,
  };
}
