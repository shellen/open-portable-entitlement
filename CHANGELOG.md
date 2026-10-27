# Changelog

Changes to the Open Portable Entitlement specification (`OPE-Specification.md`).
Appendix C of the specification is the authoritative record of what changed between
versions; this file is the short index. Site-only changes are not listed.

## 0.2 — Working Draft

The current version, published at <https://feedspec.org/ope/spec/>. v0.2 is a
restructuring release: a 0–17 section core built on OAuth 2.0 and its RFCs, five
profiles (Feeds, Web, API and Feature, Agents, ATProto), and appendices. Implementers of
v0.1 should start with Appendix C, which maps every v0.1 construct to its replacement.

### Revision 4 — 2026-10-05

Correctness pass.

- DPoP-bound tokens use RFC 9449's `DPoP` scheme and `token_type`; revision 3's use of
  `License` for them conflicted with RFC 9449 (§8.5, §11.1, §14).
- Clients follow a `resource_metadata` URL when one is given, and request the metadata's
  `resource` when metadata is published per scope (§5.6, §7.1). Feeds may carry the
  metadata URL.
- Scopes may nest within a Publisher; the longest prefix wins (§5.5).
- Durations in Offers and `limit` Entitlements are ISO 8601 (`P1M`, `PT72H`).
- The token response MAY carry `entitlement` for advisory display (§8.5, §9.5).
- `X-Entitlement-Remaining` renamed `Entitlement-Remaining` (RFC 6648).
- Open questions D13 and D14 added.

### Revision 3 — 2026-10-05

OPE no longer depends on any specification outside OAuth and its RFCs.

- RFC 9728 Protected Resource Metadata replaces RSL-based discovery and trust (§7.1, §13.1).
- A Terms reference by URL and digest (§6.1) and an Offer object (§6.2) replace the
  borrowed terms vocabulary. The `license` claim is renamed `terms`.
- `client_policy` moves into Protected Resource metadata (closes D10).
- `ope.publishers` renamed `resources_served`.
- §1.1 and the Roadmap reframed as alignment with RSL rather than convergence into it.

### Revision 2 — 2026-10-05

Additions for License Servers that serve more than one Publisher: a fourth conformance
target (§2.4), a Client review tier (§8.2), bundle consent (§8.4), a minimum-decision
statement (§11.2), §13 rewritten, pairwise `sub` per audience (§15), multi-Publisher test
vectors (§16), and §17 Entitlement sources and operator actions.

### Revision 1 — 2026-09-24

Restructured v0.1 into the v0.2 core, profiles, and appendices. Highlights (full table in
Appendix C):

- Goals, non-goals, and acceptance stories S1–S5 added as the scope gate (§0).
- New vocabulary: Asset, Terms, Offer, License Server, Resource Server, Client, Subject,
  License Token, Entitlement, Coverage. "Grant" is no longer used.
- `/.well-known/ope`, the separate grant endpoints, Simple and Portable token modes,
  PASETO and macaroons, `OPE-*` headers, the broker subsystem, and `content_metadata`
  withdrawn in favor of OAuth equivalents.
- One token format: a JWT on the RFC 9068 profile, with `typ: license+jwt`.
- JSON Feed extension renamed `_ope`; Atom and RSS use `<ope:offer>`.
- ATProto integration deferred to Profile E; the v0.1 text is kept at
  `profiles/atproto/v0.1-draft.md`.
- Batch retrieval withdrawn from the core; see `profiles/feeds/batch.md`.

## 0.1 — 2026-03-27

First public draft. Superseded; kept at <https://feedspec.org/ope/spec/0.1/> and in
`archive/OPE-Specification-0.1.md`.

Changes made to the v0.1 text after first publication:

- 2026-05-05 — Added §3.2, Relationship to Content Licensing Standards.
- 2026-03-31 — Linked the ATProto permissioned data proposal; acknowledgments updated.
- 2026-03-28 — Grant types consolidated into three primitives (`access`, `limit`,
  `signal`); branded example names replaced; web-based entitlement, consent, Dynamic
  Client Registration, and error standardization added; web entitlement made optional.
