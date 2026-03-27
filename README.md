# Open Portable Entitlement (OPE)

**A portable entitlement layer for the open web.**

OPE standardizes how readers prove they have access to gated content — across any app, any feed format, and any platform. Subscribe once, read anywhere.

## Why OPE?

The web's subscription ecosystem is fragmented. Every publisher builds their own paywall, every reader app negotiates its own deals, and subscribers are locked into platform-specific access. OPE proposes a standard entitlement layer that sits between content distribution (RSS, Atom, JSON Feed, AT Protocol) and payment processing (Stripe, x402, Lightning). Publishers keep control. Readers gain portability. The open web gets a missing piece.

OPE doesn't handle payments — it proves you're allowed in. How you earned access (subscription, gift, institutional, patronage) is up to the publisher. OPE standardizes how that access is verified.

## Read the Spec

- **[Rendered specification](https://feedspec.org/spec/)** — navigable docs with sidebar and section anchors
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
