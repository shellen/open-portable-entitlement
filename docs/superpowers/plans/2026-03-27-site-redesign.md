# OPE Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the OPE project site using Eleventy + Tailwind CSS with a professional docs-style spec viewer (expandable sidebar, anchor links, scroll-spy, mobile drawer).

**Architecture:** Eleventy reads `OPE-Specification.md` at build time via a JS data file that extracts HTML and a heading tree. Nunjucks templates render a landing page and a two-column docs page. Tailwind v4 handles styling via PostCSS. GitHub Actions deploys to `gh-pages`.

**Tech Stack:** Eleventy 3.x, Tailwind CSS v4, `@tailwindcss/postcss`, `@11ty/eleventy-plugin-syntaxhighlight`, PostCSS, Nunjucks, vanilla JS (IntersectionObserver)

**Design Spec:** `docs/superpowers/specs/2026-03-27-site-redesign-design.md`

---

## File Structure

```
open-portable-entitlement/
├── src/
│   ├── _includes/
│   │   ├── base.njk              # Base HTML shell (head, fonts, nav, footer)
│   │   ├── landing.njk           # Landing page layout (extends base)
│   │   └── docs.njk              # Docs layout with sidebar (extends base)
│   ├── _data/
│   │   └── spec.js               # Reads OPE-Specification.md → { html, nav }
│   ├── css/
│   │   └── main.css              # Tailwind v4 entry (@import "tailwindcss" + @theme)
│   ├── js/
│   │   └── docs.js               # Scroll-spy, sidebar expand/collapse, mobile drawer, anchor copy
│   ├── index.njk                 # Landing page content
│   └── spec.njk                  # Spec page (uses docs layout + spec data)
├── OPE-Specification.md          # Unchanged
├── eleventy.config.js            # Eleventy config (ESM)
├── package.json
├── .gitignore                    # Add _site/, node_modules/
├── README.md                     # Project README
└── _site/                        # Build output (gitignored)
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `eleventy.config.js`
- Create: `.gitignore`
- Create: `src/css/main.css`

- [ ] **Step 1: Initialize npm project**

```bash
cd /Users/shellen/Code/open-portable-entitlement
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install --save-dev @11ty/eleventy @11ty/eleventy-plugin-syntaxhighlight @tailwindcss/postcss @tailwindcss/typography postcss tailwindcss marked@^14
```

`marked` (pinned to v14+) is used by the spec data file to render markdown to HTML at build time. `@tailwindcss/typography` provides the `prose` classes used in the docs layout.

- [ ] **Step 3: Add `"type": "module"` and npm scripts to package.json**

Edit `package.json` to add:

```json
{
  "type": "module",
  "scripts": {
    "dev": "npx @11ty/eleventy --serve",
    "build": "npx @11ty/eleventy"
  }
}
```

Eleventy 3.x is ESM-only, so `"type": "module"` is required.

- [ ] **Step 4: Write eleventy.config.js**

```js
// ABOUTME: Eleventy configuration for the OPE documentation site.
// ABOUTME: Sets input/output dirs, registers plugins, and configures CSS passthrough.

import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);

  // Process CSS through PostCSS (Tailwind v4)
  eleventyConfig.addTemplateFormats("css");
  eleventyConfig.addExtension("css", {
    outputFileExtension: "css",
    compile: async function (inputContent, inputPath) {
      if (!inputPath.includes("main.css")) return;
      const result = await postcss([tailwind]).process(inputContent, {
        from: inputPath,
      });
      return async () => result.css;
    },
  });

  // Pass through JS files
  eleventyConfig.addPassthroughCopy("src/js");

  return {
    pathPrefix: "/open-portable-entitlement/",
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
```

- [ ] **Step 5: Write src/css/main.css**

```css
/* ABOUTME: Tailwind CSS v4 entry point for the OPE site. */
/* ABOUTME: Contains theme tokens and base typography overrides. */

@import "tailwindcss";
@plugin "@tailwindcss/typography";
@source "../**/*.{njk,js}";

@theme {
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-light: #eff6ff;
  --color-surface: #ffffff;
  --color-bg: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  --color-border: #e5e7eb;
  --color-code-bg: #f3f4f6;
  --color-code-block-bg: #1e293b;
  --color-code-block-text: #e2e8f0;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", monospace;
}
```

- [ ] **Step 6: Update .gitignore**

Append to existing `.gitignore` (or create if missing):

```
_site/
node_modules/
.superpowers/
```

- [ ] **Step 7: Verify Eleventy builds with empty project**

```bash
mkdir -p src && echo "Hello OPE" > src/index.njk
npx @11ty/eleventy
```

Expected: builds to `_site/index.html` with no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json eleventy.config.js .gitignore src/css/main.css src/index.njk
git commit -m "feat: scaffold Eleventy + Tailwind v4 project"
```

---

### Task 2: Base Template and Navigation

**Files:**
- Create: `src/_includes/base.njk`

- [ ] **Step 1: Write base.njk**

The base template provides the HTML shell shared by both landing and docs pages: `<head>` with fonts and CSS, sticky nav, footer, and content block.

```njk
{# ABOUTME: Base HTML template shared by all pages. #}
{# ABOUTME: Provides head, sticky nav, content block, and footer. #}

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ title }} — Open Portable Entitlement</title>
  <meta name="description" content="{{ description | default('A portable entitlement layer for gated content. OPE standardizes entitlement verification across platforms, readers, and protocols.') }}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ '/css/main.css' | url }}">
</head>
<body class="font-[family-name:var(--font-sans)] text-[var(--color-text-primary)] bg-[var(--color-bg)] leading-relaxed">

  <!-- Nav -->
  <nav class="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-[var(--color-border)]">
    <div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
      <a href="{{ '/' | url }}" class="font-extrabold text-lg tracking-tight flex items-center gap-2 text-[var(--color-text-primary)] no-underline">
        <span class="inline-flex items-center justify-center w-8 h-8 bg-[#0f172a] text-white rounded-lg text-xs font-extrabold tracking-widest">OPE</span>
        Open Portable Entitlement
      </a>
      <ul class="flex items-center gap-6 list-none m-0 p-0">
        <li class="hidden md:block"><a href="{{ '/spec/' | url }}" class="text-[var(--color-text-secondary)] text-sm font-medium hover:text-[var(--color-text-primary)] no-underline">Specification</a></li>
        <li><a href="https://github.com/shellen/open-portable-entitlement" class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-hover)] no-underline">GitHub</a></li>
      </ul>
    </div>
  </nav>

  {% block content %}{% endblock %}

  <!-- Footer -->
  <footer class="py-8 border-t border-[var(--color-border)] text-center">
    <p class="text-sm text-[var(--color-text-tertiary)]">
      OPE is a working draft by <a href="https://shellen.com" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Jason Shellen</a>.
      Discuss and contribute on <a href="https://github.com/shellen/open-portable-entitlement" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">GitHub</a>.
    </p>
  </footer>

</body>
</html>
```

- [ ] **Step 2: Update src/index.njk to use base template**

Replace the test content with a minimal page that uses the base layout:

```njk
---
layout: base.njk
title: OPE
---
<div class="max-w-6xl mx-auto px-6 py-20">
  <h1 class="text-4xl font-extrabold">Portable subscriptions for the open web</h1>
  <p class="text-lg text-[var(--color-text-secondary)] mt-4">Placeholder — landing page coming in Task 4.</p>
</div>
```

- [ ] **Step 3: Build and verify**

```bash
npx @11ty/eleventy --serve
```

Open `http://localhost:8080`. Verify: sticky nav with OPE logo, nav links, footer. Tailwind styles applied (fonts, colors, spacing).

- [ ] **Step 4: Commit**

```bash
git add src/_includes/base.njk src/index.njk
git commit -m "feat: add base template with nav and footer"
```

---

### Task 3: Spec Data File and Docs Layout

**Files:**
- Create: `src/_data/spec.js`
- Create: `src/_includes/docs.njk`
- Create: `src/spec.njk`

- [ ] **Step 1: Write src/_data/spec.js**

This data file reads `OPE-Specification.md`, renders it to HTML, and extracts a heading tree for sidebar nav.

```js
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
      <a href="#${id}" class="anchor-link" aria-hidden="true">#</a>
      ${text}
    </h${depth}>`;
  };

  const html = marked.parse(md, { renderer });

  return { html, nav };
}
```

- [ ] **Step 2: Write src/_includes/docs.njk**

Two-column docs layout: sticky sidebar on the left, main content on the right.

```njk
{# ABOUTME: Docs layout with expandable sidebar navigation. #}
{# ABOUTME: Used by the spec page for two-column documentation display. #}

{% extends "base.njk" %}

{% block content %}
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div class="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">

    <!-- Mobile menu button -->
    <button id="sidebar-toggle" class="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-[var(--color-accent)] text-white rounded-full shadow-lg flex items-center justify-center" aria-label="Toggle navigation">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
    </button>

    <!-- Sidebar overlay (mobile) -->
    <div id="sidebar-overlay" class="hidden fixed inset-0 bg-black/30 z-30 lg:hidden"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="hidden lg:block fixed lg:sticky top-16 z-30 lg:z-auto h-[calc(100vh-4rem)] w-64 lg:w-auto bg-white lg:bg-transparent border-r lg:border-r-0 border-[var(--color-border)] overflow-y-auto py-8 px-4 lg:px-0">
      <nav aria-label="Specification sections">
        <ul class="list-none m-0 p-0 space-y-1 text-sm">
          {% for section in spec.nav %}
          <li>
            <a href="#{{ section.id }}" class="nav-link flex items-center gap-1.5 py-1.5 px-2 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] no-underline" data-section="{{ section.id }}">
              {% if section.children.length > 0 %}
              <svg class="nav-chevron w-3.5 h-3.5 shrink-0 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
              {% endif %}
              <span class="{% if section.children.length == 0 %}ml-5{% endif %}">{{ section.text }}</span>
            </a>
            {% if section.children.length > 0 %}
            <ul class="nav-children hidden list-none m-0 pl-5 space-y-0.5">
              {% for child in section.children %}
              <li>
                <a href="#{{ child.id }}" class="nav-link block py-1 px-2 rounded text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] no-underline" data-section="{{ child.id }}">{{ child.text }}</a>
              </li>
              {% endfor %}
            </ul>
            {% endif %}
          </li>
          {% endfor %}
        </ul>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="min-w-0 py-8 lg:py-10">
      <article class="prose prose-gray max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-3xl prose-h1:mb-4
        prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pt-8 prose-h2:border-t prose-h2:border-[var(--color-border)]
        prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-[var(--color-text-secondary)]
        prose-strong:text-[var(--color-text-primary)]
        prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline
        prose-code:text-sm prose-code:bg-[var(--color-code-bg)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-[family-name:var(--font-mono)]
        prose-pre:bg-[var(--color-code-block-bg)] prose-pre:text-[var(--color-code-block-text)] prose-pre:rounded-lg prose-pre:font-[family-name:var(--font-mono)]
        prose-table:text-sm
        prose-th:bg-[var(--color-code-bg)] prose-th:border prose-th:border-[var(--color-border)] prose-th:px-3 prose-th:py-2
        prose-td:border prose-td:border-[var(--color-border)] prose-td:px-3 prose-td:py-2 prose-td:text-[var(--color-text-secondary)]">
        {{ content | safe }}
      </article>
    </main>

  </div>
</div>

<script src="{{ '/js/docs.js' | url }}"></script>
{% endblock %}
```

- [ ] **Step 3: Write src/spec.njk**

```njk
---
layout: docs.njk
title: Specification
---
{{ spec.html | safe }}
```

- [ ] **Step 4: Build and verify**

```bash
npx @11ty/eleventy --serve
```

Open `http://localhost:8080/spec/`. Verify:
- Spec content renders from markdown with proper typography
- Sidebar shows all spec sections in a tree
- Code blocks are syntax-highlighted
- Headings have anchor IDs
- Layout is two-column on desktop

- [ ] **Step 5: Commit**

```bash
git add src/_data/spec.js src/_includes/docs.njk src/spec.njk
git commit -m "feat: add spec data file and docs layout with sidebar nav"
```

---

### Task 4: Sidebar Interactions (scroll-spy, expand/collapse, mobile drawer)

**Files:**
- Create: `src/js/docs.js`

- [ ] **Step 1: Write src/js/docs.js**

Vanilla JS for sidebar interactivity: expand/collapse tree nodes, scroll-spy via IntersectionObserver, mobile drawer toggle, anchor link copy.

```js
// ABOUTME: Client-side interactivity for the spec docs page.
// ABOUTME: Handles sidebar expand/collapse, scroll-spy, mobile drawer, and anchor copy.

(function () {
  // Sidebar expand/collapse
  const navLinks = document.querySelectorAll(".nav-link[data-section]");
  navLinks.forEach(function (link) {
    const children = link.parentElement.querySelector(".nav-children");
    if (!children) return;
    link.addEventListener("click", function (e) {
      // Don't prevent default — still navigate to anchor
      const chevron = link.querySelector(".nav-chevron");
      const isOpen = !children.classList.contains("hidden");
      if (isOpen) {
        children.classList.add("hidden");
        if (chevron) chevron.style.transform = "";
      } else {
        children.classList.remove("hidden");
        if (chevron) chevron.style.transform = "rotate(90deg)";
      }
    });
  });

  // Scroll spy
  const headings = document.querySelectorAll(
    "article h2[id], article h3[id]"
  );
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    },
    { rootMargin: "-80px 0px -70% 0px" }
  );
  headings.forEach(function (h) {
    observer.observe(h);
  });

  function setActiveNav(id) {
    // Remove all active states
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.classList.remove(
        "text-[var(--color-accent)]",
        "font-semibold",
        "bg-[var(--color-accent-light)]"
      );
    });
    // Set active
    var active = document.querySelector('.nav-link[data-section="' + id + '"]');
    if (!active) return;
    active.classList.add(
      "text-[var(--color-accent)]",
      "font-semibold",
      "bg-[var(--color-accent-light)]"
    );
    // Expand parent if it's a child link
    var parentUl = active.closest(".nav-children");
    if (parentUl) {
      parentUl.classList.remove("hidden");
      var chevron = parentUl.parentElement.querySelector(".nav-chevron");
      if (chevron) chevron.style.transform = "rotate(90deg)";
    }
    // Scroll sidebar to keep active visible
    active.scrollIntoView({ block: "nearest" });
  }

  // Mobile drawer
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var toggle = document.getElementById("sidebar-toggle");

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", function () {
      var isOpen = !sidebar.classList.contains("hidden") && window.innerWidth < 1024;
      if (sidebar.classList.contains("hidden") || window.innerWidth >= 1024) {
        sidebar.classList.remove("hidden");
        overlay.classList.remove("hidden");
      } else {
        sidebar.classList.add("hidden");
        overlay.classList.add("hidden");
      }
    });
    overlay.addEventListener("click", function () {
      sidebar.classList.add("hidden");
      overlay.classList.add("hidden");
    });
    // Close drawer on nav link click (mobile)
    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth < 1024) {
          sidebar.classList.add("hidden");
          overlay.classList.add("hidden");
        }
      });
    });
  }

  // Anchor link copy
  document.querySelectorAll(".anchor-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var url = window.location.origin + window.location.pathname + link.getAttribute("href");
      navigator.clipboard.writeText(url).then(function () {
        link.textContent = "✓";
        setTimeout(function () {
          link.textContent = "#";
        }, 1500);
      });
    });
  });
})();
```

- [ ] **Step 2: Add anchor link CSS to main.css**

Append to `src/css/main.css`:

```css
.anchor-link {
  opacity: 0;
  margin-left: 0.5rem;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-weight: 400;
  transition: opacity 0.15s;
}

.group:hover .anchor-link {
  opacity: 1;
}

.anchor-link:hover {
  color: var(--color-accent);
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 5rem;
}
```

- [ ] **Step 3: Build and verify**

```bash
npx @11ty/eleventy --serve
```

Open `http://localhost:8080/spec/`. Test:
- Click a sidebar section → smooth scroll to heading
- Sections with children show chevron → click expands/collapses children
- Scroll through content → sidebar highlight follows
- Hover a heading → # link appears → click copies URL
- Resize to mobile width → sidebar hidden, floating button visible → tap opens drawer → tap link closes drawer

- [ ] **Step 4: Commit**

```bash
git add src/js/docs.js src/css/main.css
git commit -m "feat: add sidebar scroll-spy, expand/collapse, mobile drawer, anchor copy"
```

---

### Task 5: Landing Page

**Files:**
- Create: `src/_includes/landing.njk`
- Modify: `src/index.njk`

- [ ] **Step 1: Write src/_includes/landing.njk**

Landing layout extends base — just a pass-through for landing-specific structure.

```njk
{# ABOUTME: Landing page layout wrapping base template. #}
{# ABOUTME: Provides the content block for the marketing-style homepage. #}

{% extends "base.njk" %}

{% block content %}
{{ content | safe }}
{% endblock %}
```

- [ ] **Step 2: Rewrite src/index.njk with full landing page content**

Port all sections from the current `index.html` into Nunjucks with Tailwind classes. Preserve all copy, section order, and inline SVGs. The file will be long but is a single page with no logic — just markup.

Reference the current `index.html` for exact copy text. Port each section:

1. **Hero** — dark bg section with badge, h1, subtitle, two CTA buttons
2. **Principles** — 4-column grid (2-col on tablet, 1-col on mobile) with SVG icons
3. **Design Philosophy** — section header + 4 layer cards, OPE card highlighted
4. **Flow** — 5 numbered steps in a row (stacks on mobile)
5. **Code Example** — 2-column: text + code block
6. **Audience** — 3-column cards: Publishers, Reader Apps, Brokers
7. **Grant Types** — 4-column grid of 8 grant type cards
8. **Compatibility** — centered flex-wrap of pill tags
9. **CTA** — dark bg section with heading, text, two buttons

Use Tailwind utility classes throughout. Match the visual design tokens from the spec (white/gray backgrounds, blue accents, Inter font).

```njk
---
layout: landing.njk
title: OPE
---

<!-- Hero -->
<section class="bg-[#0f172a] text-[#f8fafc] py-20 md:py-24 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37, 99, 235, 0.12), transparent), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(37, 99, 235, 0.06), transparent)"></div>
  <div class="max-w-6xl mx-auto px-6 relative">
    <div class="max-w-2xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/15 text-blue-300 rounded-full text-xs font-semibold tracking-wide mb-6">Draft Specification v0.1</div>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter mb-6">Portable subscriptions for the open web</h1>
      <p class="text-lg text-[#94a3b8] leading-relaxed mb-8 max-w-xl">OPE is a portable entitlement layer that lets readers access gated content across any app, any feed format, and any platform. Subscribe once, read anywhere.</p>
      <div class="flex flex-wrap gap-3">
        <a href="{{ '/spec/' | url }}" class="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] no-underline">Read the Spec</a>
        <a href="https://github.com/shellen/open-portable-entitlement" class="inline-flex items-center gap-2 px-6 py-3 border border-[#94a3b833] text-[#94a3b8] rounded-lg font-semibold hover:text-[#f8fafc] hover:border-[#94a3b880] no-underline">View on GitHub</a>
      </div>
    </div>
  </div>
</section>

<!-- Principles -->
<section class="bg-white border-y border-[var(--color-border)] py-16">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-xl mb-4">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 class="font-bold mb-2">Entitlement, not payments</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">OPE proves you're allowed in. Payment processors handle money. Clean separation.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-xl mb-4">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <h3 class="font-bold mb-2">Truly portable</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Your subscription works in any OPE-compatible reader. No platform lock-in.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-xl mb-4">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
        </div>
        <h3 class="font-bold mb-2">Works with any feed</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">RSS, Atom, JSON Feed, AT Protocol. OPE extends what you already use.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-xl mb-4">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 class="font-bold mb-2">Publisher-controlled</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Publishers issue grants and control access. Their content, their rules.</p>
      </div>
    </div>
  </div>
</section>

<!-- Design Philosophy -->
<section class="py-20" id="how-it-works">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">Design Philosophy</span>
      <h2 class="text-2xl md:text-3xl font-bold mb-4">Four layers, cleanly separated</h2>
      <p class="text-[var(--color-text-secondary)]">OPE occupies the space between content distribution and payment processing. Each concern stays independent.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-6 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]">
        <div class="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Layer 1</div>
        <h3 class="font-bold mb-2">Content</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Articles, media, and resources. Created and hosted by the publisher.</p>
      </div>
      <div class="p-6 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]">
        <div class="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Layer 2</div>
        <h3 class="font-bold mb-2">Distribution</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Feed formats (RSS, Atom, JSON Feed, ATProto) that catalog and deliver previews.</p>
      </div>
      <div class="p-6 border border-[var(--color-accent)] rounded-xl bg-[var(--color-accent-light)]">
        <div class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">Layer 3 — OPE</div>
        <h3 class="font-bold mb-2">Entitlement</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">Verification that a reader has the right to access content. Portable across apps.</p>
      </div>
      <div class="p-6 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)]">
        <div class="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Layer 4</div>
        <h3 class="font-bold mb-2">Payments</h3>
        <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">How money changes hands. Stripe, x402, Lightning, or anything else. Out of scope.</p>
      </div>
    </div>
  </div>
</section>

<!-- Flow -->
<section class="py-20 bg-[var(--color-bg)]">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">The Flow</span>
      <h2 class="text-2xl md:text-3xl font-bold mb-4">From feed to full content</h2>
      <p class="text-[var(--color-text-secondary)]">Five steps from discovering an article in your reader to reading the full thing.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 border-2 border-[var(--color-border)] rounded-full font-bold text-[var(--color-accent)] bg-white mb-4">1</div>
        <h4 class="font-bold mb-1 text-sm">Feed</h4>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">Reader fetches a feed and finds OPE-gated items with preview content.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 border-2 border-[var(--color-border)] rounded-full font-bold text-[var(--color-accent)] bg-white mb-4">2</div>
        <h4 class="font-bold mb-1 text-sm">Discovery</h4>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">Reader fetches <code class="text-xs bg-[var(--color-code-bg)] px-1 py-0.5 rounded">/.well-known/ope</code> to learn the publisher's capabilities.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 border-2 border-[var(--color-border)] rounded-full font-bold text-[var(--color-accent)] bg-white mb-4">3</div>
        <h4 class="font-bold mb-1 text-sm">Authenticate</h4>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">Reader initiates OAuth 2.0 with PKCE. User logs in with the publisher.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 border-2 border-[var(--color-border)] rounded-full font-bold text-[var(--color-accent)] bg-white mb-4">4</div>
        <h4 class="font-bold mb-1 text-sm">Grant</h4>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">Publisher issues a signed grant token proving entitlement.</p>
      </div>
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-14 h-14 border-2 border-[var(--color-border)] rounded-full font-bold text-[var(--color-accent)] bg-white mb-4">5</div>
        <h4 class="font-bold mb-1 text-sm">Read</h4>
        <p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">Reader presents the token and retrieves full content. Done.</p>
      </div>
    </div>
  </div>
</section>

<!-- Code Example -->
<section class="bg-white border-y border-[var(--color-border)] py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold mb-4">Simple discovery, powerful access</h2>
        <p class="text-[var(--color-text-secondary)] mb-6">Publishers expose a single well-known endpoint. Reader apps handle the rest — OAuth, token management, content retrieval — all standardized.</p>
        <ul class="space-y-3 list-none p-0">
          <li class="flex gap-3 text-sm text-[var(--color-text-secondary)]"><strong class="text-[var(--color-text-primary)] whitespace-nowrap">Discovery:</strong> JSON manifest at a well-known URL</li>
          <li class="flex gap-3 text-sm text-[var(--color-text-secondary)]"><strong class="text-[var(--color-text-primary)] whitespace-nowrap">Auth:</strong> Standard OAuth 2.0 with PKCE, PAR, DPoP</li>
          <li class="flex gap-3 text-sm text-[var(--color-text-secondary)]"><strong class="text-[var(--color-text-primary)] whitespace-nowrap">Tokens:</strong> JWT, PASETO, or Macaroons — your choice</li>
          <li class="flex gap-3 text-sm text-[var(--color-text-secondary)]"><strong class="text-[var(--color-text-primary)] whitespace-nowrap">Content:</strong> Single item or batch retrieval APIs</li>
          <li class="flex gap-3 text-sm text-[var(--color-text-secondary)]"><strong class="text-[var(--color-text-primary)] whitespace-nowrap">Feeds:</strong> Non-breaking extensions to existing formats</li>
        </ul>
      </div>
      <div class="bg-[#1e293b] text-[#e2e8f0] rounded-xl overflow-hidden font-[family-name:var(--font-mono)] text-xs leading-relaxed">
        <div class="flex items-center gap-2 px-4 py-3 bg-black/20 border-b border-white/5">
          <span class="w-2 h-2 rounded-full bg-white/15"></span>
          <span class="w-2 h-2 rounded-full bg-white/15"></span>
          <span class="w-2 h-2 rounded-full bg-white/15"></span>
          <span class="ml-2 text-white/40 text-xs">/.well-known/ope</span>
        </div>
        <pre class="p-5 overflow-x-auto m-0">{
  <span class="text-blue-300">"version"</span>: <span class="text-green-300">"0.1"</span>,
  <span class="text-blue-300">"oauth_server"</span>: <span class="text-green-300">"https://example.com/.well-known/oauth-authorization-server"</span>,
  <span class="text-blue-300">"entitlement"</span>: {
    <span class="text-blue-300">"grant_url"</span>: <span class="text-green-300">"https://example.com/api/entitlement/grant"</span>,
    <span class="text-blue-300">"refresh_url"</span>: <span class="text-green-300">"https://example.com/api/entitlement/refresh"</span>,
    <span class="text-blue-300">"token_format"</span>: <span class="text-green-300">"jwt"</span>,
    <span class="text-blue-300">"token_mode"</span>: <span class="text-green-300">"portable"</span>,
    <span class="text-blue-300">"default_ttl_seconds"</span>: <span class="text-yellow-300">3600</span>
  },
  <span class="text-blue-300">"content"</span>: {
    <span class="text-blue-300">"endpoint_template"</span>: <span class="text-green-300">"https://example.com/api/content/{id}"</span>,
    <span class="text-blue-300">"batch_endpoint"</span>: <span class="text-green-300">"https://example.com/api/content/batch"</span>,
    <span class="text-blue-300">"formats_available"</span>: [<span class="text-green-300">"html"</span>, <span class="text-green-300">"markdown"</span>]
  },
  <span class="text-blue-300">"grants_supported"</span>: [
    <span class="text-green-300">"subscription"</span>, <span class="text-green-300">"gift"</span>, <span class="text-green-300">"per_item"</span>, <span class="text-green-300">"broker"</span>
  ]
}</pre>
      </div>
    </div>
  </div>
</section>

<!-- Audience -->
<section class="py-20" id="for-whom">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">Who It's For</span>
      <h2 class="text-2xl md:text-3xl font-bold mb-4">Built for the entire ecosystem</h2>
      <p class="text-[var(--color-text-secondary)]">OPE is designed so publishers, reader apps, and intermediaries each get exactly what they need.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white border border-[var(--color-border)] rounded-xl p-8">
        <h3 class="font-bold text-lg mb-3">Publishers</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mb-5">Keep full control of your content and subscriptions while making them work everywhere.</p>
        <ul class="space-y-2 list-none p-0">
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Add OPE metadata to your existing feeds</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Expose a single discovery endpoint</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Use the reference gateway or build your own</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Support any payment processor you want</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">WordPress, Ghost, Substack migration paths</li>
        </ul>
      </div>
      <div class="bg-white border border-[var(--color-border)] rounded-xl p-8">
        <h3 class="font-bold text-lg mb-3">Reader Apps</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mb-5">Give your users seamless access to gated content from any OPE-enabled publisher.</p>
        <ul class="space-y-2 list-none p-0">
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Detect OPE extensions in any feed format</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Manage per-publisher OAuth sessions</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Show rich previews with content metadata</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Batch retrieval for fast offline sync</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Unified subscription view across publishers</li>
        </ul>
      </div>
      <div class="bg-white border border-[var(--color-border)] rounded-xl p-8">
        <h3 class="font-bold text-lg mb-3">Brokers</h3>
        <p class="text-sm text-[var(--color-text-secondary)] mb-5">Create subscription bundles across multiple publishers. Like cable bundles, but for the open web.</p>
        <ul class="space-y-2 list-none p-0">
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Aggregate entitlements across publishers</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Issue broker grant tokens with Macaroons</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Capability attenuation for scoped access</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Single sign-on for multi-publisher access</li>
          <li class="text-sm text-[var(--color-text-secondary)] pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--color-accent)]">Enable new business models</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- Grant Types -->
<section class="py-20 bg-[var(--color-bg)]">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">Flexible Access</span>
      <h2 class="text-2xl md:text-3xl font-bold mb-4">Eight grant types, one protocol</h2>
      <p class="text-[var(--color-text-secondary)]">OPE doesn't prescribe how entitlements are earned — it standardizes how they're proven.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Subscription</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Recurring access to all content</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Per-item</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Pay per article, scoped to content IDs</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Gift</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Shareable unlock links, time-limited</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Institutional</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Libraries, universities, organizations</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Metered</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Free article limits with meter tracking</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Locale-free</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Regional free access by user locale</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Patronage</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Voluntary support, optional full access</p>
      </div>
      <div class="p-5 bg-white border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-colors">
        <h4 class="font-bold text-sm mb-1">Broker</h4>
        <p class="text-xs text-[var(--color-text-secondary)]">Multi-publisher bundles via brokers</p>
      </div>
    </div>
  </div>
</section>

<!-- Compatibility -->
<section class="bg-white border-y border-[var(--color-border)] py-20">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-xl mx-auto mb-14">
      <span class="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-3 block">Compatibility</span>
      <h2 class="text-2xl md:text-3xl font-bold mb-4">Works with what you already use</h2>
      <p class="text-[var(--color-text-secondary)]">OPE is a purely additive extension. Readers without OPE support simply see previews as usual.</p>
    </div>
    <div class="flex flex-wrap justify-center gap-3">
      {% for tag in ["RSS 2.0", "Atom", "JSON Feed", "AT Protocol", "OAuth 2.0", "JWT", "PASETO", "Macaroons", "DPoP", "PAR / RAR", "x402", "Stripe", "WordPress", "Ghost"] %}
      <span class="inline-flex items-center px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full text-sm font-medium text-[var(--color-text-secondary)]">{{ tag }}</span>
      {% endfor %}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="bg-[#0f172a] text-[#f8fafc] text-center py-20">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-2xl md:text-3xl font-bold mb-4">Start building with OPE</h2>
    <p class="text-[#94a3b8] text-lg mb-8 max-w-lg mx-auto">The specification is open and ready for implementers. Read it, build on it, and help shape portable entitlements for the open web.</p>
    <div class="flex flex-wrap justify-center gap-3">
      <a href="/spec/" class="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] no-underline">Read the Specification</a>
      <a href="https://github.com/shellen/open-portable-entitlement" class="inline-flex items-center gap-2 px-6 py-3 border border-[#94a3b833] text-[#94a3b8] rounded-lg font-semibold hover:text-[#f8fafc] hover:border-[#94a3b880] no-underline">Contribute on GitHub</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Build and verify**

```bash
npx @11ty/eleventy --serve
```

Open `http://localhost:8080`. Verify all sections render with proper Tailwind styling, responsive at mobile/tablet/desktop breakpoints.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/landing.njk src/index.njk
git commit -m "feat: add landing page with all content sections"
```

---

### Task 6: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# Open Portable Entitlement (OPE)

**A portable entitlement layer for the open web.**

OPE standardizes how readers prove they have access to gated content — across any app, any feed format, and any platform. Subscribe once, read anywhere.

## Why OPE?

The web's subscription ecosystem is fragmented. Every publisher builds their own paywall, every reader app negotiates its own deals, and subscribers are locked into platform-specific access. OPE proposes a standard entitlement layer that sits between content distribution (RSS, Atom, JSON Feed, AT Protocol) and payment processing (Stripe, x402, Lightning). Publishers keep control. Readers gain portability. The open web gets a missing piece.

OPE doesn't handle payments — it proves you're allowed in. How you earned access (subscription, gift, institutional, patronage) is up to the publisher. OPE standardizes how that access is verified.

## Read the Spec

- **[Rendered specification](https://shellen.github.io/open-portable-entitlement/spec/)** — navigable docs with sidebar and section anchors
- **[Plain text (Markdown)](./OPE-Specification.md)** — the spec source file, readable on GitHub

## Local Development

```bash
npm install
npm run dev
```

Opens a local server at `http://localhost:8080` with live reload.

## Build

```bash
npm run build
```

Outputs to `_site/`.

## Contributing

OPE is a working draft. Feedback, questions, and contributions are welcome:

1. **Open an issue** to discuss ideas or report problems
2. **Submit a pull request** for spec changes or site improvements
3. **Start a discussion** in GitHub Discussions for broader topics

The specification source is `OPE-Specification.md`. The site is built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Author

[Jason Shellen](https://shellen.com) — [@shellen.com](https://bsky.app/profile/shellen.com) on Bluesky

## License

This specification and site are open source. See [LICENSE](./LICENSE) for details.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "feat: add project README"
```

---

### Task 7: Cleanup Old Files

**Files:**
- Delete: `index.html`
- Delete: `spec/index.html`
- Delete: `css/style.css`

- [ ] **Step 1: Remove old static files**

```bash
git rm index.html spec/index.html css/style.css
rmdir css spec 2>/dev/null || true
```

- [ ] **Step 2: Build and verify nothing is broken**

```bash
npm run build
```

Verify `_site/index.html` and `_site/spec/index.html` exist and render correctly.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove old static HTML and CSS files"
```

---

### Task 8: GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write deploy.yml**

```yaml
# ABOUTME: GitHub Actions workflow to build and deploy the OPE site.
# ABOUTME: Triggers on push to main, builds with Eleventy, deploys to GitHub Pages.

name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deployment workflow"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Full build from clean state**

```bash
rm -rf _site node_modules
npm install
npm run build
```

- [ ] **Step 2: Verify all pages**

```bash
npm run dev
```

Check:
- `http://localhost:8080` — landing page with all sections
- `http://localhost:8080/spec/` — spec with sidebar, scroll-spy, anchor links
- Mobile responsive (resize browser or use dev tools)
- All links work (nav, CTAs, footer)
- Code blocks have syntax highlighting
- `OPE-Specification.md` still exists and is unchanged

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A && git status
# Review changes, then commit if needed
git commit -m "fix: final adjustments from verification"
```
