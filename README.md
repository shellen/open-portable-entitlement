# Open Portable Entitlement (OPE)

**A portable entitlement layer for the open web.**

OPE standardizes how users prove they have access to gated content — across any app, any feed format, and any platform. Subscribe once, access anywhere: articles, podcasts, video, music, courses, and more.

## Why OPE?

The web's subscription ecosystem is fragmented. Every publisher builds their own paywall, every podcast platform locks premium episodes to its app, every reader negotiates its own deals, and subscribers are locked into platform-specific access. OPE proposes a standard entitlement layer that sits between content distribution (RSS, Atom, JSON Feed, AT Protocol) and payment processing (Stripe, x402, Lightning). Publishers keep control. Users gain portability. The open web gets a missing piece.

OPE doesn't handle payments — it proves you're allowed in. How you earned access (subscription, gift, institutional, patronage, trial, ad-free tier) is up to the publisher. OPE standardizes how that access is verified — for articles, podcast episodes, video, music, courses, and any other gated resource.

## Read the Spec

- **[Rendered specification](https://feedspec.org/ope/spec/)** — navigable docs with sidebar and section anchors
- **[Plain text (Markdown)](./OPE-Specification.md)** — the spec source file, readable on GitHub

## Try the Demo

The **[OPE Eleventy Demo](https://github.com/shellen/ope-eleventy-demo)** is a working reference implementation you can run locally in one command. It includes:

- **Publisher** — an Eleventy blog with OPE-enabled feeds and a content API
- **Gateway** — an Express server that issues and manages grant tokens
- **Reader** — a browser UI and CLI that walks through the full OPE lifecycle

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

## Contributing

OPE is a working draft. Feedback, questions, and contributions are welcome:

1. **Open an issue** to discuss ideas or report problems
2. **Submit a pull request** for spec changes or site improvements
3. **Start a discussion** in GitHub Discussions for broader topics

The specification source is `OPE-Specification.md`. The site is built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Author

[Jason Shellen](https://shellen.com) — [@shellen.com](https://bsky.app/profile/shellen.com) on Bluesky

## License

This specification and site are licensed under the [Apache License 2.0](./LICENSE).
