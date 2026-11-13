# Open Portable Entitlement (OPE)

**A portable entitlement layer for the open web.**

OPE lets a person prove they hold access to something (an article, a podcast episode, a course, a pro feature, an API) and carry that proof across the apps they choose. It is built from OAuth 2.0 and its published RFCs, and adds only the claims that say what a person holds.

## Why OPE?

The web's subscription ecosystem is fragmented. Every publisher builds their own paywall, every podcast platform locks premium episodes to its app, every reader negotiates its own deals, and subscribers are locked into platform-specific access. OPE proposes a standard entitlement layer that sits between distribution (RSS, Atom, JSON Feed, the web, and apps) and payment processing (Stripe, x402, Lightning). Publishers keep control. Users gain portability. The open web gets a missing piece.

OPE doesn't handle payments — it proves you're allowed in. How you earned access (subscription, gift, institutional, patronage, trial, ad-free tier) is up to the publisher. OPE standardizes how that access is verified, for articles, podcast episodes, video, courses, software features, and any other gated Asset.

## Read the Spec

The published version is **v0.1**. **v0.2** (revision 5), a proposed revision that rebuilds OPE on standard OAuth 2.0, is open for public comment.

- **[Proposed v0.2 draft](https://feedspec.org/ope/spec/0.2/)**: navigable docs with sidebar and section anchors; source in [`OPE-Specification.md`](./OPE-Specification.md)
- **[Published v0.1](https://feedspec.org/ope/spec/)**: also at [/ope/spec/0.1/](https://feedspec.org/ope/spec/0.1/); source in [`archive/`](./archive/OPE-Specification-0.1.md)
- **[Changelog](./CHANGELOG.md)**: what changed in each revision; Appendix C of the spec has the full record
- **[Feed namespace for v0.2](https://feedspec.org/ope/ns/0.2/)**: the proposed `ope:` elements for RSS and Atom

**Comment on v0.2** until November 19, 2026, in [the comment issue](https://github.com/shellen/open-portable-entitlement/issues/23), or open an issue of your own: what breaks for your product, what's unclear, what's missing. Corrections and updates made during the comment period are announced there and recorded in Appendix C and the changelog. Appendix D of the draft lists the questions still open.

Implementers of v0.1 should start with Appendix C of v0.2, which maps every v0.1 construct to its replacement. Which version `/ope/spec/` serves is set in `src/_data/spec.js`.

## Try the Demo

The **[OPE Eleventy Demo](https://github.com/shellen/ope-eleventy-demo)** is a working reference implementation you can run locally in one command. It still implements the **v0.1** draft and will be updated for v0.2. It includes:

- **Publisher**: an Eleventy blog with OPE-enabled feeds and a content API
- **Gateway**: an Express server that issues and manages access tokens (v0.1 "grant tokens")
- **Reader**: a browser UI and CLI that walks through the full OPE lifecycle

```bash
git clone https://github.com/shellen/ope-eleventy-demo.git
cd ope-eleventy-demo
./run-demo.sh
```

## Repository layout

```
OPE-Specification.md   The v0.2 draft (the source of /ope/spec/0.2/ and /ope/spec/0.2.md)
CHANGELOG.md           What changed in each revision, and during the comment period
archive/               The v0.1 text
profiles/              Supporting profile material: the v0.1 atproto draft and feed batch retrieval (both informative)
src/                   The feedspec.org site: the OPE landing page, the spec pages, the feed
                       namespace pages, the demo walkthrough (/ope/demo/), and an entitlement builder
src/_data/spec.js      Renders each spec version, and sets which one /ope/spec/ serves
tests/                 Playwright site and accessibility tests
docs/                  Design notes for the site
```

## Local Development

You need Node.js 20 or later.

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

## Test

```bash
npm test
```

Runs the Playwright site and accessibility tests against a local server. On every push to `main`, GitHub Actions builds the site, runs the tests, and deploys it to GitHub Pages at feedspec.org.

## Contributing

OPE is a working draft. Feedback, questions, and contributions are welcome:

1. **Open an issue** to discuss ideas or report problems. For a substantive change to the spec, include a scenario, the text being changed, and replacement text.
2. **Submit a pull request** for spec changes or site improvements.

The specification source is `OPE-Specification.md` (v0.2); the v0.1 text is in `archive/`, and supporting profile material is in `profiles/`. The site is built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Author

[Jason Shellen](https://shellen.com) — [@shellen.com](https://bsky.app/profile/shellen.com) on Bluesky

## License

This specification and site are licensed under the [Apache License 2.0](./LICENSE).
