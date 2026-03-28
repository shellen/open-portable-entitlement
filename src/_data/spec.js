// ABOUTME: Reads OPE-Specification.md and produces rendered HTML plus a nav tree.
// ABOUTME: The nav tree powers the expandable sidebar on the spec docs page.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export default function () {
  const mdPath = path.resolve(__dirname, "../../OPE-Specification.md");
  const md = fs.readFileSync(mdPath, "utf-8");

  // Single slugger shared between renderer and nav extraction
  // to guarantee IDs match between sidebar links and heading anchors
  const slugify = createSlugger();
  const nav = [];
  let currentH2 = null;

  const renderer = new marked.Renderer();
  renderer.heading = function ({ text, depth }) {
    const id = slugify(text);

    // Build nav tree as we render (single pass)
    if (depth === 2) {
      currentH2 = { id, text, children: [] };
      nav.push(currentH2);
    } else if (depth === 3 && currentH2) {
      currentH2.children.push({ id, text });
    }

    return `<h${depth} id="${id}" class="group">
      ${text}
      <a href="#${id}" class="anchor-link" aria-hidden="true">#</a>
    </h${depth}>`;
  };

  const html = marked.parse(md, { renderer });

  return { html, nav, md };
}
