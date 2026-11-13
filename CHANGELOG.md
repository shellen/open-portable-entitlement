# Changelog

Changes to the Open Portable Entitlement specification (`OPE-Specification.md`).
Appendix C of the specification is the authoritative record of what changed between
versions; this file is the short index. Site-only changes are not listed.

## 0.2 — Proposed draft, open for comment

Published for public comment at <https://feedspec.org/ope/spec/0.2/>; it moves to
<https://feedspec.org/ope/spec/> if adopted. v0.1 remains the published version until then.
v0.2 is a
restructuring release: a §0–§18 core built on OAuth 2.0 and its RFCs, five
profiles (Feeds, Web, API and Feature, Agents, ATProto), and appendices. Implementers of
v0.1 should start with Appendix C, which maps every v0.1 construct to its replacement.

### Update during the comment period — 2026-11-13

- Informative only. Profile E follows the atproto spaces proposal and the alpha both revised
  on 2026-11-12, first noted in the comment issue
  (<https://github.com/shellen/open-portable-entitlement/issues/23#issuecomment-6839596851>):
  - The alpha now uses `checkAccess`, as the notes already described. Getting a
    credential is `authorizeSpaceSync`.
  - New note: a space credential admits an app, not each reader. A multi-user app must
    check each user's entitlement itself, and OPE can supply that check: a License Token
    for the space's Asset, per user.
  - The privacy and client policy notes are revised to match. The client attestation is
    the source of `clientId`.
  - The implementation status notes that the reference implementation now includes a
    multi-user app doing that per-user check.

  No requirement changes. Profile E stays deferred.

### Update during the comment period — 2026-11-12

- Informative only. Updates known out-of-date information in Profile E's notes, first noted
  in the comment issue (<https://github.com/shellen/open-portable-entitlement/issues/23#issuecomment-6814252569>):
  - The access check is now `checkAccess` (`space`, an optional `repo`, an optional
    `clientId` → `{read, write}`). The published alpha's `checkUserAccess` is noted.
  - The service auth audience is the full `did#serviceId`. A space host denies access
    when the managing app is unreachable.
  - Only the space authority can revoke a credential early. When an Entitlement ends,
    no new credentials are issued, and issued ones lapse within their lifetime.
  - The policy can be published in the space.
  - Account linking is described as the reference implementation does it: atproto
    OAuth, identity only, with a check of the authorization server.
  - The notes record what the reference implementation has tested.

  No requirement changes. Profile E stays deferred.

### Clarification during the comment period — 2026-11-11 (demo)

- Informative only. Appendix B's reference-implementation note now says the Eleventy demo
  implements this draft and runs live, with a walkthrough at
  <https://feedspec.org/ope/demo/>. Site-only: the walkthrough page itself, and links to it
  from the OPE landing page and the v0.2 notice.

### Clarification during the comment period — 2026-11-11

- Informative only. Profile E's notes follow the current atproto spaces proposal: the
  Publisher is the space authority, and the License Server is the space's `managedspace`
  managing app, answering `checkUserAccess` from the Entitlement record. Corrects
  revision 5's guessed mapping, confirms HTTP Message Signatures for space credentials,
  and lists open questions (account linking, DID privacy, client policy).

### Clarification during the comment period — 2026-11-10

- Informative only. §1.1 now says RSL governs what may be done with content and OPE
  governs who may receive it, and that they meet in the Terms reference every License
  Token carries (restoring a point from v0.1 §3.2). §3 lists Cloudflare Content Signals;
  Appendix E adds IPTC RightsML, the IETF AI Preferences vocabulary, and Content Signals.

### Correction during the comment period — 2026-11-06

- §11.4, §5.4, and Appendix B now match §7.1: a `401` or `402` challenge carries
  `resource_metadata` for a URL with per-URL metadata and `ope_scope` otherwise. They had
  required `resource_metadata` everywhere, which RFC 9728 §3.3 makes incompatible with
  scope metadata. A URL with per-URL metadata must be challenged with `resource_metadata`
  (§7.1).

### Revision 5 — 2026-10-27

Review pass: fixes from two adversarial reviews and a cross-check against the RSL 1.0
text. Several changes are breaking for revision 4 implementers.

- **Breaking:** Protected Resource metadata follows RFC 9728 §3.3 exactly: per URL, with
  the new `ope.asset` naming the Asset a URL serves or exercises, or per scope, found
  through the feed or the `ope_scope` challenge parameter (§5.6, §7.1).
- **Breaking:** the License Server chooses the token's `resource` (the requested Asset or
  a scope containing it) and returns it in the token response. One `resource` per
  authorization request (§5.6, §8.1, §8.5).
- **Breaking:** `coverage` is `item` or `collection`, required for every type, and says
  whether `resource` is a scope; `pre-release` is now a `kind` (§5.5, §10).
- **Breaking:** the token response must carry `resource` and `entitlement` (§8.5).
- **Breaking:** `ope.offer` became the `ope.offers` array; Offers may carry an `id`
  (§6.2, §7.1).
- **Breaking:** RFC 9728 `protected_resources` replaces `ope.resources_served` (§7.2).
- Publisher identifiers: `ope.publisher` and the `publisher` claim (§5.8).
- `aud` is derived from `resource` and `ope.audience` (§9.2).
- Enforcement has six steps; `status` grants no access by itself; `rental_expires_at`
  is enforced (§10.4, §11.2).
- Error codes defined: `no_entitlement`, `entitlement_suspended`, `quota_exceeded`;
  requests without a token get challenges without an error code (§11.4).
- Introspection returns `publisher` and `cnf`, and accepts RSL's `resource` parameter
  and `permitted` member (§12.4).
- Bundles carry Terms and may be authorized by bundle identifier, then narrowed per
  Publisher (§13.6).
- A Publisher selling over a scope keeps metadata uniform across it (§5.6).
- Group and institutional tokens live at most an hour (§9.4).
- Web profile recast as site-mediated unlock (Profile B).
- A step-by-step Client algorithm (Appendix B).
- New §18, IANA Considerations.
- **Breaking:** feed elements move to the `https://feedspec.org/ope/ns/0.2` namespace;
  `ope:terms` becomes an empty element with `url`, `sha256`, and `type` attributes; new
  channel-level Offers and `ope:asset` (Profile A). D9 closed.
- Resource Servers normalize request URLs and refuse encoded path separators (§5.3).
- JWKS refetched at least every 5 minutes; compromised keys can be withdrawn at once
  (§7.3, §17.3).
- Refresh-token replay revokes the whole grant (§12.1).
- Per-Publisher Client revocation and an optional `revocation_reason` (§12.4, §17.3).
- Agent delegation is one hop (Profile D).
- Scope metadata: one RFC 9728 document can cover a whole scope, found from a feed's
  channel-level Offer or the new `ope_scope` challenge parameter; Clients parse metadata
  as JSON whatever its `Content-Type` (§5.6, §7.1).
- Text license settled as Apache 2.0 (D1); D14 closed.

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

First public draft, and the published version while v0.2 is under comment. Served at
<https://feedspec.org/ope/spec/> and permanently at <https://feedspec.org/ope/spec/0.1/>;
source in `archive/OPE-Specification-0.1.md`.

Changes made to the v0.1 text after first publication:

- 2026-05-05 — Added §3.2, Relationship to Content Licensing Standards.
- 2026-03-31 — Linked the ATProto permissioned data proposal; acknowledgments updated.
- 2026-03-28 — Grant types consolidated into three primitives (`access`, `limit`,
  `signal`); branded example names replaced; web-based entitlement, consent, Dynamic
  Client Registration, and error standardization added; web entitlement made optional.
