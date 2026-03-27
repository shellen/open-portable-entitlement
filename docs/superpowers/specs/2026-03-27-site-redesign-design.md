# OPE Site Redesign — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Goal

Rebuild the OPE project site using Eleventy and Tailwind CSS to provide a professional documentation experience for implementers. The spec page should feel like Tailwind/Next.js docs — navigable, linkable, mobile-friendly. The landing page retains its current content with updated styling.

## Stack

- **Static site generator:** Eleventy (11ty)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss` plugin
- **Syntax highlighting:** `@11ty/eleventy-plugin-syntaxhighlight` (Prism-based, zero client JS)
- **Spec source:** `OPE-Specification.md` (existing markdown, remains source of truth)
- **Hosting:** GitHub Pages via GitHub Actions (builds `_site/` and deploys to `gh-pages` branch)

## Pages

### 1. Landing Page (`/`)

Restyled version of the current `index.html` content. All existing sections preserved:

- Hero with badge, title, subtitle, CTAs
- Principles strip (4 cards: entitlement not payments, portable, any feed, publisher-controlled)
- Design philosophy — four layers diagram
- Flow — five steps from feed to full content
- Code example — well-known endpoint JSON
- Audience cards — publishers, reader apps, brokers
- Grant types — eight grant type cards
- Compatibility tags — RSS, Atom, JSON Feed, etc.
- CTA section
- Footer

**Visual style:** Full light theme. White/light gray backgrounds, blue accents for interactive elements and highlights. Clean typography with Inter + JetBrains Mono.

### 2. Spec Documentation (`/spec/`)

Two-column layout rendering the full OPE specification from markdown.

**Left sidebar:**
- Expandable tree navigation
- Top-level items are spec sections (1. Abstract, 2. Status, 3. Design Philosophy, etc.)
- Clicking a section expands to show subsections
- Active section highlighted with blue accent
- Sticky, scrolls independently from content
- On mobile: collapses to a slide-out drawer triggered by hamburger button

**Main content area:**
- Rendered markdown with full typography styles
- Every heading gets an anchor link (click-to-copy URL)
- Code blocks with syntax highlighting
- Tables styled consistently
- Scroll-spy: sidebar highlights the current section as the user scrolls

**Header:**
- Sticky nav bar across both pages
- Logo/title linking to landing page
- Links: Spec, GitHub
- Consistent with landing page nav

### 3. Raw Markdown

`OPE-Specification.md` stays in the repo root unchanged. Linked from the spec page and README for people who prefer plain text.

## Eleventy Architecture

```
open-portable-entitlement/
├── src/
│   ├── _includes/
│   │   ├── base.njk          # Base HTML template
│   │   ├── landing.njk       # Landing page layout
│   │   └── docs.njk          # Docs layout (sidebar + content)
│   ├── _data/
│   │   └── spec.js           # Reads OPE-Specification.md, returns { html, nav }
│   ├── css/
│   │   └── main.css          # Tailwind v4 entry point (@import "tailwindcss" + @theme)
│   ├── index.njk             # Landing page
│   └── spec.njk              # Spec page (pulls in spec data)
├── OPE-Specification.md       # Spec source of truth (unchanged)
├── eleventy.config.js         # Eleventy config (ESM, handles PostCSS inline)
├── package.json
└── _site/                     # Build output (gitignored)
```

**Eleventy configuration:**
- Input directory: `src/`. Output directory: `_site/`. Configured via `dir: { input: 'src', output: '_site' }`.
- A JS data file (`src/_data/spec.js`) reads `OPE-Specification.md` from the repo root, renders it to HTML, and extracts a heading tree for the sidebar nav. Returns `{ html, nav }`.
- Tailwind v4 integrates via `@tailwindcss/postcss` in the PostCSS pipeline.
- `@11ty/eleventy-plugin-syntaxhighlight` handles code block highlighting at build time.
- Output goes to `_site/` (gitignored). GitHub Actions builds and deploys to `gh-pages` branch.

## Sidebar Navigation Generation

The sidebar nav is auto-generated from the spec markdown headings by `src/_data/spec.js`:

1. The `#` (H1) heading is treated as the page title and excluded from nav
2. `##` headings become top-level nav items
3. `###` headings become children of their preceding `##` parent
4. Each heading gets a slugified anchor ID
5. The data file returns a nested array: `[{ id, text, children: [{ id, text }] }]`
6. The `docs.njk` template renders this as an expandable tree
7. Client-side vanilla JS using `IntersectionObserver` handles: expand/collapse, scroll-spy highlighting, mobile drawer

## Key Interactions

- **Anchor links:** Clicking a heading shows a link icon; clicking copies the anchor URL via the Clipboard API
- **Scroll spy:** As user scrolls content, sidebar highlights the current section and expands its parent if collapsed
- **Mobile drawer:** Hamburger icon opens sidebar as an overlay. Tapping a link scrolls to section and closes drawer.
- **Smooth scroll:** Clicking sidebar items smooth-scrolls to the target heading

## Visual Design Tokens

- **Background:** white (`#ffffff`) and light gray (`#f9fafb`)
- **Text:** dark gray (`#111827`) primary, medium gray (`#6b7280`) secondary
- **Accent:** blue (`#2563eb`) for links, active nav, highlights
- **Code:** light gray background (`#f3f4f6`), dark code blocks (`#1e293b` bg, `#e2e8f0` text)
- **Fonts:** Inter for body, JetBrains Mono for code
- **Border radius:** subtle (0.375rem–0.75rem)
- **Spacing:** generous, content-focused

## README Update

The README should cover:
- What OPE is (1-2 paragraph summary)
- Project motivation — why portable entitlements matter for the open web
- Links to: live site, rendered spec, raw markdown spec
- Quick start for local development (`npm install && npm run dev`)
- How to contribute
- License

## What Changes

| Before | After |
|--------|-------|
| Hand-rolled CSS (870 lines) | Tailwind utility classes |
| Static HTML files | Eleventy templates |
| `marked.js` client-side rendering | Build-time markdown rendering |
| No sidebar nav on spec | Expandable sidebar with scroll-spy |
| No anchor links | Click-to-copy anchors on every heading |
| No mobile nav for spec | Slide-out drawer |
| Minimal README | Full project README with motivations |

## What Stays the Same

- `OPE-Specification.md` remains the canonical spec source
- All landing page content and copy preserved
- Same information architecture (landing + spec)
- GitHub as primary repo and discussion venue

## Assets

- **Fonts:** Inter and JetBrains Mono loaded via Google Fonts CDN (same as current site)
- **Icons:** Inline SVGs from current `index.html` preserved in Nunjucks templates
- **Old CSS:** `css/style.css` deleted after migration is complete
- **Old HTML:** `index.html` and `spec/index.html` deleted after migration; replaced by Eleventy templates

## Out of Scope

- Dark mode toggle
- Search functionality
- Versioned spec support
- Comments or discussion features
- CI checks (linting, link validation, etc.)
