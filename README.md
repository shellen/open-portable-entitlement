# Open Portable Entitlement (OPE)

**A portable entitlement layer for the open web.**

OPE lets a person prove they hold access to something (an article, a podcast episode, a course, a pro feature, an API) and carry that proof across the apps they choose. It is built from OAuth 2.0 and its published RFCs, and adds only the claims that say what a person holds.

## Why OPE?

The web's subscription ecosystem is fragmented. Every publisher builds their own paywall, every podcast platform locks premium episodes to its app, every reader negotiates its own deals, and subscribers are locked into platform-specific access. OPE proposes a standard entitlement layer that sits between distribution (RSS, Atom, JSON Feed, the web, and apps) and payment processing (Stripe, x402, Lightning). Publishers keep control. Users gain portability. The open web gets a missing piece.

OPE doesn't handle payments — it proves you're allowed in. How you earned access (subscription, gift, institutional, patronage, trial, ad-free tier) is up to the publisher. OPE standardizes how that access is verified, for articles, podcast episodes, video, courses, software features, and any other gated Asset.

## Read the Spec

The current version is **v0.2** (Working Draft, revision 5).

- **[Rendered specification](https://feedspec.org/ope/spec/)**: navigable docs with sidebar and section anchors
- **[Plain text (Markdown)](./OPE-Specification.md)**: the spec source file, readable on GitHub
- **[Changelog](./CHANGELOG.md)**: what changed in each revision; Appendix C of the spec has the full record
- **[Feed namespace](https://feedspec.org/ope/ns/0.2/)**: the `ope:` elements for RSS and Atom

The superseded v0.1 draft is kept at [feedspec.org/ope/spec/0.1/](https://feedspec.org/ope/spec/0.1/) and in [`archive/`](./archive/OPE-Specification-0.1.md). Implementers of v0.1 should start with Appendix C of v0.2.

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

## Test

```bash
npm test
```

Runs the Playwright site and accessibility tests against a local server.

## Contributing

OPE is a working draft. Feedback, questions, and contributions are welcome:

1. **Open an issue** to discuss ideas or report problems
2. **Submit a pull request** for spec changes or site improvements
3. **Start a discussion** in GitHub Discussions for broader topics

The specification source is `OPE-Specification.md`; the archived v0.1 text is in `archive/`, and supporting profile material is in `profiles/`. The site is built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Author

[Jason Shellen](https://shellen.com) — [@shellen.com](https://bsky.app/profile/shellen.com) on Bluesky

## License

This specification and site are licensed under the [Apache License 2.0](./LICENSE).
