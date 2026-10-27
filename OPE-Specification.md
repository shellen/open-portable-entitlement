# Open Portable Entitlement (OPE)

**Draft Specification v0.2**

| | |
|---|---|
| **Status** | Working Draft |
| **Version** | 0.2, revision 5 (supersedes 0.1, 2026-03-27) |
| **Date** | 2026-10-27 (revision 1: 2026-09-24; revisions 2 to 4: 2026-10-05) |
| **Editor** | Jason Shellen <https://shellen.com> (@shellen.com on ATProto / Bluesky) |
| **Canonical URL** | <https://feedspec.org/ope/spec/> |
| **Source** | <https://github.com/shellen/open-portable-entitlement> |
| **Issues** | <https://github.com/shellen/open-portable-entitlement/issues> |
| **Changelog** | Appendix C, and `CHANGELOG.md` in the repository |
| **License** | Apache License 2.0, for the text and everything else in the repository (`LICENSE`) |
| **Depends on** | OAuth 2.0, the RFCs listed as normative in Appendix E, and ISO 4217 and ISO 8601 for currency codes and durations. No other specification is required to implement OPE. |

*OPE lets a person prove they are entitled to something and carry that proof across the apps they choose. It is built from OAuth 2.0 and its published extensions and adds only what they lack: a way to issue, carry, and check an entitlement held by a person, for any kind of Asset, across organizations.*

---

## Status of This Document

This is a Working Draft published by the editor for review by feed and podcast client developers, publishing platforms, independent creators, and decentralized protocol communities. It may change substantially before wider review.

v0.2 is a restructuring release. It adds no wire primitives of its own beyond the OAuth extension points it names (§18), shrinks the normative core to OAuth plus a small set of OPE-defined claims and objects, aligns its vocabulary with Really Simple Licensing (RSL) so that implementers of both use one set of words, and moves surface-specific material into profiles. Implementers of v0.1 should read Appendix C before anything else.

Comments go to the issue tracker. Substantive proposals should be filed as issues with a scenario, the text being changed, and replacement text.

---

# Part I: Core

## 0. Goals, Non-Goals, and Acceptance Stories

This section is normative for scope. A section that cannot be traced to a goal below does not belong in the core.

### 0.1 Goals

1. **Portable proof.** A person who is entitled to an Asset can prove it in any conforming Client, not only the one the Publisher built or chose.
2. **Publisher control.** The Publisher, or a License Server acting for the Publisher, decides who is entitled, for how long, and can end it.
3. **Reuse before invention.** Authorization, tokens, discovery, revocation, and introspection come from OAuth 2.0 and its published extensions. OPE defines only the claims and objects that carry an entitlement, and borrows its vocabulary from existing work where that work already has the right word.
4. **Any Asset, any Publisher.** The thing being entitled may be an article, an episode, a feature, an API, a seat, or a bundle. The Publisher may be a newspaper or one person selling one thing. The core does not care.
5. **Standalone.** OPE can be implemented from this document and the RFCs it cites. Compatibility with other specifications is offered, never required.
6. **Enforceable where it matters.** OPE states plainly which checks are enforcement and which are advisory.

### 0.2 Non-Goals

- **Moving money.** Payment, refunds, and payouts belong to payment systems. OPE records that an entitlement exists, not how it was paid for.
- **Defining terms.** What a Publisher permits, prohibits, and charges is the Publisher's to write, in whatever form they choose. OPE references terms; it does not define a rights vocabulary.
- **Licensing machines acting for themselves.** Crawlers and agents that hold their own license to content are served by other protocols. OPE licenses a person. An agent acting *for a person* is covered by the Agents profile.
- **Being a feed format.** There is no "OPE feed." Feeds are RSS, Atom, JSON Feed, or ATProto records that carry OPE metadata.
- **Digital rights management.** OPE does not prevent a Client from copying an Asset it has legitimately received.

### 0.3 Acceptance Stories

The core is considered complete for v0.2 if a conforming implementation can satisfy S1, S2, S4, and S5. S3 is the acceptance test for the Agents profile and gates that profile, not the core. Each story names the requirement it tests.

| # | Story | Tests |
|---|---|---|
| S1 | A member buys the pro tier of a tool and uses pro features inside a third-party app. | Asset identifiers for non-documents; enforcement at the tool's server, not the app. |
| S2 | A reader subscribes to a newsletter once and reads paid issues in two different feed readers without subscribing twice. | Portability across Clients; one `sub`, many `client_id`s. |
| S3 | A listener lets an AI assistant read premium episodes on their behalf but not buy anything. | Delegation with narrowed entitlement. Gates the Agents profile (Part II D), not the core. |
| S4 | A school buys access for 200 students to a creator's course; a student leaves and loses access within an hour. | Group entitlement; revocation; short lifetimes. |
| S5 | A publisher's License Server is down for ten minutes and Resource Servers keep honoring tokens that are still within their lifetime and within each Resource Server's local-validation tolerance (§12.3). | Local validation of structured tokens. |

Measurable definition of "portable" used throughout: *a License Token issued to a subject through one Client can be validated by a Resource Server without that Resource Server contacting the Client, and the same subject can obtain a token for the same Asset through a second Client without the Publisher creating a second subscription.*

## 1. Introduction

Publishing stacks bundle content, payment, and distribution. A subscription bought in one app is locked to that app. OPE separates entitlement from the rest so that the proof of access travels with the person.

OAuth 2.0 already issues tokens to people through the Authorization Code flow, with PKCE for Clients that cannot keep a secret, and has published ways to discover endpoints (RFC 8414), discover which servers may issue for a resource (RFC 9728), name the resource a token is for (RFC 8707), structure the token so a stranger can check it (RFC 9068), refresh it, revoke it (RFC 7009), and introspect it (RFC 7662). None of these knows what an entitlement is.

OPE is the profile that adds that knowledge: a Subject claim that names a person rather than an application, an Entitlement claim that says what they hold, a reference to the Publisher's terms, an Offer object so a Client can show what is for sale before asking, and the rules a Resource Server follows to check all of it. Everything else is OAuth as published.

### 1.1 Relationship to Really Simple Licensing

Really Simple Licensing (RSL) is a specification for publishers to declare machine-readable terms for their content, with a companion protocol (OLP) under which a License Server issues license tokens to crawlers and agents that authenticate with a client secret.

OPE and RSL share a problem shape and, by design, a vocabulary. §2.2 defines OPE's roles using the same words RSL uses (Asset, Publisher, License Server, Resource Server, Client, License Token), §11.1 uses the same `License` HTTP authentication scheme for tokens that are not sender-constrained, and §12.4 accepts the same `resource` introspection parameter and returns the same `permitted` member as RSL's introspection endpoint, so that a server implementing both does not need two sets of names or two endpoints. Where RSL has the right word, OPE uses it rather than coining another. The roles share names, not every property: RSL's Client is the licensee, a crawler or agent holding its own `client_secret`, while OPE's Client acts for a person and is usually public, and OPE's License Token is identified by its JOSE `typ` (§9.1) rather than, as in RSL, by `token_type` alone.

OPE does not depend on RSL. A Publisher that publishes RSL terms can point OPE at them (§6.1), and an RSL License Server that also wants to serve people can add the OPE profile. A Publisher with no RSL document, and a creator who has never heard of it, can implement OPE in full from this document. The two differ in who is licensed: OLP licenses the Client; OPE licenses a person through any Client. A proposal to bring the two into closer alignment is a future item (Part III, Roadmap), to be made to RSL's Technical Steering Committee when OPE has independent implementations to point to.

### 1.2 Relationship to Payment Protocols

x402, Stripe's payment protocols, the Agentic Commerce Protocol, Lightning, Web Monetization, and conventional processors move money. OPE proves the result. A Publisher accepts payment however it likes and issues a License Token when the entitlement exists. The Offer object (§6.2) tells a Client what is for sale and where to buy it; OPE does not carry the transaction.

### 1.3 What v0.1 Readers Should Know

v0.1 defined its own terms vocabulary, its own discovery document at `/.well-known/ope`, two token modes, three token formats, custom `OPE-*` headers, and a separate entitlement grant endpoint. v0.2 removes all of these in favor of OAuth equivalents and a smaller set of OPE-defined objects. Appendix C maps every v0.1 construct to its v0.2 replacement.

## 2. Conformance and Terminology

### 2.1 Requirement Language

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, MAY, and OPTIONAL are to be interpreted as described in RFC 2119 and RFC 8174 when, and only when, they appear in all capitals.

### 2.2 Core Terms

OPE's role names are the same words Really Simple Licensing uses for the same roles, so that implementers of both specifications share one vocabulary. The definitions below are OPE's and are complete on their own.

| Term | Definition |
|---|---|
| **Asset** | Anything a Publisher gates and identifies by an `https` URL: a document, a media file, a feature of a service, an API, a seat, a bundle, an allotment. See §5. |
| **Publisher** | The party that controls an Asset and decides who may have it. May be an organization or an individual. May publish under its own origin or under another party's (§13.3). Identified in metadata and tokens by a Publisher identifier (§5.8). |
| **Terms** | The Publisher's statement of what is permitted, prohibited, and charged for an Asset, in whatever form the Publisher chooses. OPE references Terms by URL (§6.1); it does not define their contents. |
| **Offer** | A small machine-readable object stating what a Client needs to present an Asset for purchase: name, payment type, amount, and where to buy (§6.2). An Asset may have several. |
| **License Server** | A web service acting as an OAuth 2.0 Authorization Server that authenticates Subjects and issues, refreshes, revokes, and introspects License Tokens. May be operated by the Publisher or by another party (§13). |
| **Resource Server** | The server or CDN that serves an Asset and enforces access by checking License Tokens. |
| **Client** | An application that obtains and presents License Tokens on behalf of a Subject: a feed reader, podcast player, browser, browser extension, or agent. |
| **Subject** | The person who holds an Entitlement. Identified by the `sub` claim. Distinct from the Client that presents the token. |
| **License Token** | An OAuth access token structured as §9 defines and identified by the JOSE header `typ: license+jwt`. Presented with the `DPoP` scheme when sender-constrained and the `License` scheme otherwise (§11.1). |
| **Entitlement** | The Subject's holding: what kind of access or standing they have, for how long, from what source. Carried in the `entitlement` claim (§10); the Assets it covers are named by the token's `resource` claim. |
| **Coverage** | Whether a token's `resource` names one Asset (`item`) or a scope of Assets (`collection`), which tells a Resource Server how to match it (§10.4). Called `scope` in v0.1; renamed to avoid collision with the OAuth `scope` parameter. |
| **Advisory check** | A check of a License Token by a party that cannot be trusted to enforce the result, such as a Client toggling a feature on the Subject's own device (§11.3). |

### 2.3 Terms Deliberately Not Used

To keep one word per concept, OPE does not use these words in normative text:

| Avoided | Reason | Use instead |
|---|---|---|
| grant (noun) | Collides with OAuth grant types (`authorization_code`) | Entitlement |
| grant token | Same | License Token |
| manifest | Collides with HLS/DASH manifests | Authorization Server metadata (RFC 8414), Protected Resource metadata (RFC 9728) |
| scope (as an entitlement field) | Collides with OAuth `scope` | Coverage |
| signal | Collides with engineering usage and with adjacent projects | Status (an Entitlement type) |
| level | Never enumerated in v0.1 | Entitlement type, or the Publisher's Terms |
| reader | Second word for Client | Client |
| capability (as an Asset type) | Collides with adjacent projects' primitives and with capability-based security | Feature |
| owner | Ambiguous across rights owner, account owner, and resource owner | Publisher |
| license (as a noun for the Subject's holding) | Collides with the Publisher's Terms and with other specifications' use | Entitlement |

### 2.4 Conformance Targets

OPE defines conformance for four roles. An implementation conforms to one or more.

- **OPE License Server:** implements §5.6, §5.8, §6.1, §7.2, §8, §9, §10, §12, §13.1, §13.2, §17, and the License Server requirements of §11 and §14.
- **OPE Multi-Publisher License Server:** an OPE License Server that issues for Assets belonging to more than one Publisher. Additionally implements the rest of §13.
- **OPE Resource Server:** implements the §5 comparison and matching rules, §7.1, §11, and the Resource Server requirements of §9, §13.4, and §14.
- **OPE Client:** implements §7 discovery, §8 authorization, §12 lifecycle, and the Client requirements of §11 and §14.

Profiles (Part II) define additional conformance for specific surfaces. An implementation MAY claim core conformance without any profile.

## 3. Inventory: What OPE Reuses and Why

This section is informative. It records what was examined so that nothing here is claimed as new when it is not.

| Existing work | What it does | OPE's use |
|---|---|---|
| OAuth 2.0 (RFC 6749), PKCE (RFC 7636), Native Apps (RFC 8252), Security BCP (RFC 9700) | Authorization for people through Clients that may be public | Adopted as the only authorization path. |
| Protected Resource Metadata (RFC 9728) | A resource server publishes which authorization servers may issue for it, and 401 responses point there; an authorization server lists the resources it serves (`protected_resources`) | Adopted as discovery and as the trust relationship between Publisher and License Server, cross-checked from both sides (§13.1). OPE adds one `ope` extension member carrying the Asset, Publisher, and Offers. |
| Authorization Server Metadata (RFC 8414), Dynamic Client Registration (RFC 7591) | Discovery of endpoints; registration of Clients without a human in the loop | Adopted. OPE metadata is carried as one extension member; no new well-known suffix. |
| Resource Indicators (RFC 8707) | `resource` parameter naming the target of a token | Adopted as the Asset identifier carrier. |
| JWT Profile for Access Tokens (RFC 9068), JWT BCP (RFC 8725) | Structured, locally validatable tokens | Claim rules adopted for the License Token, with a distinct `typ` and added claims (§9.1). |
| Token Revocation (RFC 7009), Introspection (RFC 7662) | Ending and checking tokens | Adopted, with OPE members added to the introspection response (§12.4). |
| Bearer Token Usage (RFC 6750) | `WWW-Authenticate` error codes `invalid_token`, `insufficient_scope` | Error codes and challenge rules reused for the `License` and `DPoP` schemes (§11.4). The `Bearer` scheme itself is not used. |
| DPoP (RFC 9449) | Binding a token to a Client key | RECOMMENDED for public Clients. |
| Token Exchange (RFC 8693) | Delegation with narrowed rights | Used by the Agents profile. |
| OpenID Connect Core 1.0 | Identity of the Subject | A License Server MAY federate authentication to an OIDC provider; OPE does not define identity. |
| Really Simple Licensing (RSL 1.0) | Machine-readable terms for publishers; OLP for licensing crawlers and agents | Vocabulary aligned (§2.2); `License` auth scheme shared for unbound tokens (§11.1); introspection `resource` and `permitted` shared (§12.4); a Publisher's RSL document is a valid Terms URL (§6.1); payment type values shared where RSL has them (§6.2). Not required. |
| Podcasting 2.0 namespace (`podcast:`) | Podcast feed metadata including `locked`, `license`, `alternateEnclosure`, `value` | Feeds profile reuses `podcast:alternateEnclosure` for gated media and does not redefine podcast metadata. |
| Schema.org `isAccessibleForFree`, `hasPart` / `cssSelector` | Declaring paywalled sections of a page for search engines | Web profile references it; OPE does not redefine paywall markup. |
| JSON Feed 1.1 | Feed format with `_`-prefixed extensions | Feeds profile uses `_ope` (corrects v0.1's `extensions.ope`). |
| Subscribe with Google / Reader Revenue Manager Subscription Linking | A deployed portable-entitlement system between publishers and one platform | Studied as prior art. Platform-specific and not open; not reused. |
| Creative Commons, ODRL, IPTC RightsML, IETF AI Preferences | Rights and usage vocabularies | Any may be the target of a Terms URL. OPE does not choose among them. |

Not reused, with reasons: PASETO and macaroons (v0.1 §8.5) are removed from the core because RFC 9068 covers the requirement and every mainstream platform has a JWT library; macaroon attenuation is noted as future work. A separate `/.well-known/ope` discovery document is removed because RFC 9728 and RFC 8414 together already cover discovery and both allow extension members; adding a well-known suffix would require IANA registration (RFC 8615) that v0.1 never filed. A terms vocabulary is not defined because several already exist and the Publisher, not OPE, should choose.

## 4. Roles and Flow

| Role | OAuth analog | In OPE |
|---|---|---|
| Publisher | Resource Owner (policy authority) | Writes Terms and Offers; names its License Servers in Protected Resource metadata |
| Subject | Resource Owner (the person) | Authenticates; holds the Entitlement; appears as `sub` |
| Client | OAuth Client | Acts for the Subject; presents the token; MAY be public |
| License Server | Authorization Server | Authenticates the Subject; issues, refreshes, revokes, introspects License Tokens |
| Resource Server | Resource Server | Serves the Asset; publishes Protected Resource metadata; validates the token; enforces |

The complete flow:

```
1. Client encounters an Asset (via feed, page, 401/402, or link)
2. Client fetches the URL's Protected Resource metadata (RFC 9728): Asset, Publisher, License Servers, Offers
3. Client fetches the License Server's Authorization Server metadata (RFC 8414)
4. Client sends the Subject through Authorization Code + PKCE with resource=<Asset identifier>
5. License Server authenticates the Subject, checks the Entitlement, issues a License Token
   whose resource is that Asset or a scope containing it
6. Client presents the token to the Resource Server (Authorization: DPoP, or License if unbound)
7. Resource Server validates locally or by /introspect and serves, or returns 401/402/403
8. Client refreshes before expiry; License Server revokes when the Entitlement ends
```

A Client MUST NOT assume it is the only Client the Subject uses. A License Server MUST be able to issue tokens for the same Subject and Asset to more than one Client without creating more than one Entitlement.

## 5. Asset Identifiers

### 5.1 Purpose

Every Entitlement is for something. This section defines how that something is named so the same identifier appears in the Publisher's metadata, the authorization request, and the License Token, whatever kind of thing it is.

### 5.2 Requirements

1. An Asset identifier MUST be an absolute `https` URL (RFC 3986 §4.3), because it appears as `resource` in Protected Resource metadata, which RFC 9728 §1.2 requires to be `https`. Non-`https` identifiers are left to future profiles (Profile E, D4).
2. An Asset identifier SHOULD resolve as described in §5.4.
3. An Asset identifier MUST NOT include a fragment and SHOULD NOT include a query component, matching RFC 8707 §2.
4. A Publisher MUST NOT reassign an Asset identifier to a different Asset.
5. If an Asset moves, its identifier SHOULD stay the same. Identity is not location; the old URL MAY redirect.

### 5.3 Comparison

Asset identifiers are opaque. Clients, License Servers, and Resource Servers MUST compare them by simple string comparison (RFC 3986 §6.2.1) and MUST NOT infer meaning from their structure. Publishers SHOULD publish identifiers in normalized form so that string comparison is reliable.

### 5.4 Resolution

When an Asset identifier is an `https` URL, a request to it SHOULD return one of:

- the Asset, if the request carries a valid License Token or the Asset is free;
- `401` or `402` with a `WWW-Authenticate` challenge carrying `resource_metadata` (RFC 9728 §5), pointing at the Asset's Protected Resource metadata;
- for Assets that are not documents, a `401` or `402` whose body is a short description of the Asset, with the same header.

Resolving the identifier is how a Client discovers that an Asset is gated and where to obtain a token. No feed is required.

### 5.5 Scopes

An Entitlement MAY cover a set of Assets rather than one. A scope is identified by an `https` URL prefix ending in `/`, and an Asset is in scope if its identifier begins with that prefix by simple string comparison. Because an Asset identifier may also end in `/` (a page at `https://site.example/2026/10/post/`), a token says which it carries: its `resource` is a scope exactly when `entitlement.coverage` is `collection` (§10.2). Scopes MAY nest within one Publisher (a course inside a creator's catalog); where more than one scope matches an Asset, the longest prefix governs it. Scopes belonging to different Publishers MUST NOT nest or overlap; on an origin shared by several Publishers, the origin's operator assigns prefixes and is responsible for this (§13.3). Every Asset in a scope belongs to the scope's Publisher (§5.8).

### 5.6 One Identifier, Three Places

An Asset identifier appears in three places:

| Place | Field | Value |
|---|---|---|
| Protected Resource metadata | `ope.asset` (§7.1) | The Asset the URL serves or exercises. Defaults to the metadata's `resource`. |
| Authorization and token requests | `resource` (RFC 8707) | The `ope.asset` value, exactly |
| License Token | `resource` claim (§9.2) | The requested Asset identifier, or a scope (§5.5) that contains it |

Protected Resource metadata is published per URL, as RFC 9728 requires: its `resource` member MUST be identical to the URL a Client requested (RFC 9728 §3.3). For a document or media file, that URL is the Asset identifier and `ope.asset` is omitted. Wherever a URL differs from the Asset identifier, `ope.asset` names the Asset: an endpoint that exercises a paid feature (Profile C), the target of a redirect from a moved Asset (§5.2), or a signed media URL (Feeds profile).

A Client requests one Asset. The License Server decides how much the token covers: the Asset alone when the Subject holds that Asset only, or the scope the Subject's Entitlement record names (§17.1), so one token serves every Asset in it. A scope `resource` MUST begin with the token's `publisher` when the Publisher identifier is itself a scope.

Because a scope token is issued after reading one Asset's metadata and then used on others, a Publisher that sells Entitlements over a scope MUST publish the same `authorization_servers`, `ope.publisher`, `ope.audience`, and `client_policy` for every URL in that scope. A Publisher that needs different values for some Assets gives them a scope of their own. A License Server MUST NOT issue a token whose `resource` neither equals nor contains the requested Asset identifier. The token response states the issued `resource` (§8.5) so the Client can reuse the token across the scope.

### 5.7 Non-Goals

An Asset identifier names the Asset. It does not carry terms. Tiers, limits, durations, and prices belong in the Offer and the Entitlement, never in the URI. `https://inkwell.example/features/pro-export` is a valid identifier. `https://inkwell.example/features/pro-export?tier=gold&limit=1000` is not.

### 5.8 Publisher Identifiers

Every Asset belongs to exactly one Publisher. A Publisher identifier is an `https` URL the Publisher controls or, for a Publisher without its own origin, the scope its host assigns it (§13.3): `https://inkwell.example/`, `https://platform.example/creators/alice/`. It is compared by simple string comparison.

The Publisher identifier appears as `ope.publisher` in each Asset's Protected Resource metadata (§7.1) and as the `publisher` claim in every License Token (§9.2). A License Token names one Publisher. The rules that separate Publishers (non-overlapping scopes §5.5, one Publisher per token §13.6, introspection isolation §13.4, pairwise `sub` §15) are stated in terms of this value.

## 6. Terms and Offers

### 6.1 Terms Are the Publisher's, by Reference

OPE does not define permissions, prohibitions, prices, or payment vocabulary. A Publisher's Terms are whatever the Publisher publishes: a plain web page, a Creative Commons deed, an RSL document, an ODRL policy, a PDF. OPE carries a reference to them, so that every token records what the Subject agreed to and every Resource Server can find what applies.

A Terms reference is an object:

```json
{ "url": "https://inkwell.example/terms/pro", "sha256": "n4bQgYhMfWWa...", "type": "text/html" }
```

| Member | Required | Meaning |
|---|---|---|
| `url` | REQUIRED | Where the Terms live. MUST be `https`. |
| `sha256` | REQUIRED in tokens, OPTIONAL in metadata | base64url SHA-256 of the Terms representation the License Server holds at issuance (below), so that later changes are detectable |
| `type` | OPTIONAL | Media type of the body. A Publisher using RSL sets `application/rsl+xml`. |

A License Server MUST hold a copy of the Terms fetched within the last 24 hours, compute `sha256` over it, and place the reference in the token's `terms` claim (§9.2). The digest identifies that copy, the one current when the Subject consented (§8.4); "at issuance" means "as held at issuance", not a fetch per token.

The digest input is the representation returned by an unauthenticated `GET` of `url` with no cookies and with `Accept` set to `type` when `type` is present, after any content coding (such as `gzip`) is removed. A Publisher SHOULD serve its Terms as a static representation that is identical for every such request: no per-visitor markup, nonces, or consent banners. Terms that vary by locale or experiment cannot be digested stably; see D3.

A Resource Server MAY compare the token's `sha256` with the current Terms to detect that Terms have changed since issuance (§14, terms integrity). The License Server MUST show the Subject a link to `url` on the consent screen (§8.4). A Publisher SHOULD also set RFC 9728's `resource_tos_uri` to the same URL so that generic OAuth tooling finds it.

### 6.2 Offers

A Client needs to show a Subject what is for sale before sending them to authorize. The Offer object carries the minimum for that. It is not a terms vocabulary; it is a shop window. An Asset may have several Offers (monthly and annual, student and standard), carried as an array (§7.1).

```json
{
  "id": "pro-monthly",
  "name": "Inkwell Pro",
  "payment": { "type": "subscription", "amount": "8.00", "currency": "USD", "period": "P1M" },
  "purchase_url": "https://inkwell.example/pro",
  "terms": { "url": "https://inkwell.example/terms/pro" },
  "preview_note": "Pro export, version history, and priority support."
}
```

| Member | Required | Meaning |
|---|---|---|
| `id` | OPTIONAL | An identifier for the Offer, unique among the Asset's Offers. When present, the License Server echoes it in the issued Entitlement (`offer`, §10.2) so a Client can tell which Offer a holding came from. |
| `name` | REQUIRED | Human-readable name of what is being offered |
| `payment.type` | REQUIRED | One of `subscription`, `purchase`, `rental`, `free`, `contribution`, `institutional`. `purchase`, `subscription`, `contribution`, and `free` are the same words RSL 1.0 uses for its payment types, so that a Publisher using both writes them once; `rental` and `institutional` are OPE's (D2). |
| `payment.amount`, `payment.currency` | OPTIONAL | Decimal string and ISO 4217 code. Omit for `free` and `institutional`. |
| `payment.period` | OPTIONAL | Billing period for `subscription`, or rental length for `rental`, as an ISO 8601 duration (`P1M`, `P1Y`, `PT72H`) |
| `purchase_url` | REQUIRED unless `type` is `free` or `institutional` | Where a Subject with no Entitlement goes to get one. A Client opens it in a browser. For `institutional`, it MAY point at information on how to get access through an institution. |
| `entitlement_types` | OPTIONAL | Informational: which of `access`, `limit`, `status` (§10) the Offer results in, so a Client can label it. Nothing in the protocol depends on it. |
| `terms` | REQUIRED | Terms reference (§6.1) |
| `preview_note` | OPTIONAL | One line for unentitled display |

Offers appear in the Asset's Protected Resource metadata (§7.1) and MAY be repeated in feeds (Feeds profile). An Offer is informational; the Entitlement in the token is what the Resource Server enforces.

**After purchase.** OPE defines no signal from the Publisher's checkout back to the Client. A Client that opened `purchase_url` SHOULD let the Subject retry authorization when they return, and MAY retry once on its own when it regains focus. A License Server that receives an authorization request from a Subject with no Entitlement responds with the error `no_entitlement` (§11.4), which tells the Client to show the Offers rather than retry.

## 7. Discovery

OPE uses two published OAuth discovery documents and adds one extension member to each. No OPE-specific well-known location exists.

### 7.1 Protected Resource Metadata (Asset side)

A Resource Server serving gated Assets MUST publish OAuth 2.0 Protected Resource Metadata (RFC 9728) for each gated URL. The document says which License Servers may issue for the resource, which Asset and Publisher it belongs to, and what is for sale.

Location is as RFC 9728 §3.1 specifies: `/.well-known/oauth-protected-resource` inserted between the host and the path of the resource URL. The document's `resource` MUST be identical to that URL (RFC 9728 §3.3), so metadata is per URL, not per scope; a server with many Assets generates the documents rather than storing them. What the Assets share (Publisher, Offers, License Servers) is repeated in each.

```json
{
  "resource": "https://inkwell.example/features/pro-export",
  "resource_name": "Inkwell Pro export",
  "resource_tos_uri": "https://inkwell.example/terms/pro",
  "authorization_servers": ["https://license.lantern.example"],
  "bearer_methods_supported": ["header"],
  "ope": {
    "version": "0.2",
    "publisher": "https://inkwell.example/",
    "offers": [
      {
        "id": "pro-monthly",
        "name": "Inkwell Pro",
        "payment": { "type": "subscription", "amount": "8.00", "currency": "USD", "period": "P1M" },
        "purchase_url": "https://inkwell.example/pro",
        "terms": { "url": "https://inkwell.example/terms/pro" }
      },
      {
        "id": "pro-annual",
        "name": "Inkwell Pro (annual)",
        "payment": { "type": "subscription", "amount": "80.00", "currency": "USD", "period": "P1Y" },
        "purchase_url": "https://inkwell.example/pro?plan=annual",
        "terms": { "url": "https://inkwell.example/terms/pro" }
      }
    ],
    "client_policy": { "allow": [{ "domain": "*" }], "deny": [] }
  }
}
```

| `ope` member | Required | Meaning |
|---|---|---|
| `version` | REQUIRED | OPE version implemented |
| `asset` | OPTIONAL | The Asset identifier (§5) this URL serves or exercises. Defaults to `resource`. Present when the URL is an endpoint that uses an Asset named elsewhere (Profile C). |
| `publisher` | REQUIRED | The Publisher identifier (§5.8) of the Asset |
| `offers` | REQUIRED | Array of one or more Offers (§6.2) for the Asset |
| `audience` | OPTIONAL | Array of further origins whose Resource Servers serve or exercise this Asset, such as an API host or media CDN on another origin. The License Server adds them to `aud` (§9.2). |
| `client_policy` | OPTIONAL | Which Clients a License Server may issue to for this Asset (below). Default allows all. |

`client_policy` has two arrays, `allow` and `deny`. Each entry is one of:

- `{ "domain": "<host>" }`: matches a Client whose control of that domain the License Server has verified, by a software statement (RFC 7591 §2.3) signed by a key the domain publishes, or by the License Server's own verification of `client_uri` and `redirect_uris` on that domain. A `client_uri` the Client merely asserts does not match. `{ "domain": "*" }` matches every Client, verified or not.
- `{ "issuer": "<License Server issuer>", "client_id": "<id>" }`: matches that `client_id` at that License Server only, since `client_id` values are issued per License Server.

A License Server MUST NOT issue for a Client matched by `deny`, or for a Client not matched by `allow`, under the policy in its most recent fetch of the metadata. A Publisher that wants to refuse unverified Clients omits `{ "domain": "*" }` from `allow`.

`authorization_servers` is the Publisher's half of the trust relationship between Publisher and License Server; the License Server's `protected_resources` (§7.2) is the other half (§13.1). A License Server MUST NOT issue for a resource whose Protected Resource metadata does not list its `issuer`, and a Resource Server MUST NOT accept tokens from an issuer its own metadata does not list.

On `401` and `402`, the Resource Server MUST include a `WWW-Authenticate` challenge with `resource_metadata` set to the metadata URL for the requested URL (RFC 9728 §5), so a Client that arrived with no other context can find everything above. A Client:

- MUST use a `resource_metadata` URL from a challenge when one is given, and MUST discard the document unless its `resource` is identical to the URL it requested (RFC 9728 §3.3);
- MAY use a `metadata` URL from a feed (Feeds profile) only if it has the same origin as the feed's Asset identifier, and MUST discard the document unless its `resource` is identical to that identifier;
- otherwise constructs the well-known URL from the Asset identifier (RFC 9728 §3.1).

### 7.2 Authorization Server Metadata (License Server side)

An OPE License Server MUST publish OAuth 2.0 Authorization Server Metadata (RFC 8414) at the location RFC 8414 §3.1 constructs from its `issuer`; for an issuer with no path component, `<issuer>/.well-known/oauth-authorization-server`.

The metadata MUST include `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `revocation_endpoint`, `introspection_endpoint`, `code_challenge_methods_supported` (including `S256`), `grant_types_supported` (including `authorization_code` and `refresh_token`), and `protected_resources` (RFC 9728 §4). It SHOULD include `registration_endpoint` (RFC 7591) and `dpop_signing_alg_values_supported` (RFC 9449).

`protected_resources` lists the Assets and scopes this License Server is willing to issue for, and the value checked against it is the requested Asset identifier (`ope.asset`), not the URL whose metadata named it. OPE profiles the member's RFC 9728 §4 meaning in two ways: an entry ending in `/` covers every Asset whose identifier begins with it (§5.5), and an Asset the list does not cover is refused rather than merely unadvertised. It is the License Server's half of the trust relationship (§13.1).

OPE-specific values are carried as one extension member, `ope`:

```json
{
  "issuer": "https://license.lantern.example",
  "authorization_endpoint": "https://license.lantern.example/authorize",
  "token_endpoint": "https://license.lantern.example/token",
  "introspection_endpoint": "https://license.lantern.example/introspect",
  "revocation_endpoint": "https://license.lantern.example/revoke",
  "registration_endpoint": "https://license.lantern.example/register",
  "jwks_uri": "https://license.lantern.example/jwks.json",
  "grant_types_supported": ["authorization_code", "refresh_token", "urn:ietf:params:oauth:grant-type:token-exchange"],
  "code_challenge_methods_supported": ["S256"],
  "dpop_signing_alg_values_supported": ["ES256"],
  "protected_resources": ["https://inkwell.example/", "https://platform.example/creators/alice/"],
  "ope": {
    "version": "0.2",
    "entitlement_types_supported": ["access", "limit", "status"],
    "max_token_lifetime": 3600,
    "profiles": ["feeds", "web", "api"]
  }
}
```

| `ope` member | Required | Meaning |
|---|---|---|
| `version` | REQUIRED | OPE version implemented |
| `entitlement_types_supported` | REQUIRED | Subset of `access`, `limit`, `status` |
| `max_token_lifetime` | REQUIRED | Longest `exp` minus `iat` this server issues, in seconds |
| `bundles` | OPTIONAL | Bundles this server sells across Publishers (§13.6): an array of objects with `resource` (the bundle identifier), `name`, `publishers` (Publisher identifiers), and `terms` (the bundle's Terms reference, §6.1) |
| `profiles` | OPTIONAL | Profiles from Part II this server supports |

Servers MAY continue to serve v0.1's `/.well-known/ope` during transition; it is not part of v0.2 conformance.

### 7.3 Caching

Clients SHOULD cache both metadata documents for no less than one hour and no more than 24 hours, honoring `Cache-Control`. Resource Servers SHOULD cache JWKS documents per their `Cache-Control` and MUST refetch on an unknown `kid`. License Servers MUST refetch a resource's Protected Resource metadata at least every 24 hours and before issuing if the cached copy is older (§13.2).

## 8. Authorization

### 8.1 Flow

A License Server MUST support the OAuth 2.0 Authorization Code flow with PKCE (`S256`) for issuing License Tokens to Subjects. This is the only authorization path OPE defines.

The authorization request MUST include exactly one `resource` parameter (RFC 8707): the `ope.asset` of the Asset's Protected Resource metadata (§5.6), or a bundle identifier (§13.6). A License Server MUST reject a request carrying more than one `resource` with `invalid_target` (RFC 8707 §2). A request with no `resource` is likewise rejected with `invalid_target`. The token request, including a refresh, repeats that `resource`, except after a bundle authorization, where the Client names one Asset in the bundle on each token request (§13.6).

```
GET /authorize
  ?response_type=code
  &client_id=margin_desktop
  &redirect_uri=example.margin:/oauth/callback
  &resource=https%3A%2F%2Finkwell.example%2Ffeatures%2Fpro-export
  &code_challenge=<S256>
  &code_challenge_method=S256
  &state=<random>
```

The License Server MAY use Pushed Authorization Requests (RFC 9126) and Rich Authorization Requests (RFC 9396). Neither is required.

### 8.2 Public Clients

Feed readers, podcast players, browser extensions, CLI tools, and mobile apps are usually public Clients (RFC 6749 §2.1). A License Server:

- MUST accept public Clients on the Authorization Code flow with PKCE;
- MUST NOT issue a `client_secret` to a Client registered as public;
- SHOULD support DPoP (RFC 9449) and SHOULD bind License Tokens issued to public Clients with `cnf`;
- SHOULD support Dynamic Client Registration (RFC 7591) so that any conforming Client can register without an out-of-band process, and MAY limit newly registered Clients until reviewed;
- MUST honor a Publisher's `client_policy` (§7.1) for the resource being requested.

**Client review (informative).** Open registration makes a License Server a target for Clients that harvest tokens or misrepresent themselves. A License Server that accepts dynamic registration SHOULD place new Clients in a restricted tier until reviewed: token lifetime no longer than 15 minutes, no refresh token, no bundle authorizations (§13.6), and a visible "unreviewed" marker on the consent screen. Review MAY be manual or automated (verified `client_uri` domain, software statement, reputation). The restricted tier is operator policy, not protocol state; the token carries no indication of it.

### 8.3 Identity of the Subject

OPE does not define how the License Server authenticates the Subject. It MAY use its own accounts, OpenID Connect federation to an external provider, passkeys, or magic links. Whatever the method, the License Server MUST produce a `sub` that is stable for that Subject at that issuer across Clients and over time, and MUST NOT use an email address or other directly identifying value as `sub`. See §15 for pairwise `sub` values.

### 8.4 Consent

Before issuing an authorization code, the License Server MUST show the Subject a consent screen stating the Client's name and verified domain, the Asset or scope being authorized (by the Offer's `name`, not the raw URI alone), a link to the Terms, the token lifetime, and how to revoke. The License Server MAY skip consent for a repeat authorization from the same Client for the same or narrower `resource`.

When the `resource` is a bundle identifier (§13.6), the consent screen MUST name the bundle and MUST list every Publisher whose Assets it covers.

### 8.5 Token Response

The token endpoint response MUST set `token_type` to `DPoP` when the token is DPoP-bound (RFC 9449 §5) and to `License` otherwise, and MUST include `expires_in`, `resource`, and `entitlement`. It SHOULD include `refresh_token`. `expires_in` MUST NOT be `0`; non-expiring tokens are not permitted because they cannot be revoked at a Resource Server that validates locally.

`resource` is a copy of the token's `resource` claim: the Asset requested, or the scope containing it that the License Server chose (§5.6). With `entitlement.coverage`, which says whether `resource` is a scope, a Client uses it to reuse the token for other Assets in that scope without parsing the token (§9.5).

```json
{
  "access_token": "<structured license token>",
  "token_type": "DPoP",
  "expires_in": 3600,
  "refresh_token": "<opaque>",
  "resource": "https://inkwell.example/features/pro-export",
  "entitlement": { "type": "access", "coverage": "item", "duration": "recurring", "source": "direct", "offer": "pro-monthly" }
}
```

`entitlement` is a copy of the token's `entitlement` claim, so a Client can match Assets and make advisory checks (§11.3) without parsing the token. It proves nothing; only the token does.

## 9. Structured License Token

### 9.1 Format

An OPE License Token is a JWS-signed JWT that follows the claim rules of RFC 9068 §2.2, with the additions below. It is not an RFC 9068 token: its JOSE header `typ` MUST be `license+jwt`, not `at+jwt`, so that a License Token cannot be mistaken for an ordinary access token from the same issuer (RFC 8725 §3.11), and a Resource Server that accepts only `at+jwt` (RFC 9068 §4) rejects it, as intended. The `resource`, `publisher`, `terms`, and `entitlement` claims are OPE's (§18).

### 9.2 Claims

The RFC 9068 §2.2 claim rules apply except where this table differs.

| Claim | Requirement | Value |
|---|---|---|
| `iss` | REQUIRED | The License Server's `issuer`, which MUST appear in the Asset's Protected Resource metadata `authorization_servers` |
| `sub` | REQUIRED | The Subject (§8.3), a person. |
| `client_id` | REQUIRED | The Client the token was issued through. Kept distinct from `sub`. |
| `aud` | REQUIRED | The origin of `resource`, plus each origin in the Asset's `ope.audience` (§7.1). RFC 8707 would have the audience be the `resource` value itself; OPE uses origins so that one token serves every URL of a scope. |
| `resource` | REQUIRED | The requested Asset identifier, or a scope containing it (§5.6) |
| `publisher` | REQUIRED | The Publisher identifier (§5.8) from the Asset's metadata. Exactly one. |
| `terms` | REQUIRED | Terms reference (§6.1), with `sha256` populated: the Terms of the Offer under which the Entitlement was obtained, or of the bundle (§13.6) when it came from one |
| `entitlement` | REQUIRED | The Subject's holding (§10) |
| `exp`, `iat`, `jti` | REQUIRED | Per RFC 9068 |
| `cnf` | OPTIONAL, SHOULD for public Clients | DPoP or mTLS confirmation |
| `act` | OPTIONAL | Actor, when the token was obtained by delegation (Agents profile) |

```json
{
  "iss": "https://license.lantern.example",
  "sub": "s_3f9a1c",
  "client_id": "margin_desktop",
  "aud": ["https://inkwell.example"],
  "resource": "https://inkwell.example/features/pro-export",
  "publisher": "https://inkwell.example/",
  "terms": { "url": "https://inkwell.example/terms/pro", "sha256": "n4bQgYhMfWWa...", "type": "text/html" },
  "entitlement": {
    "type": "access",
    "coverage": "item",
    "duration": "recurring",
    "source": "direct",
    "offer": "pro-monthly"
  },
  "iat": 1790000000,
  "exp": 1790003600,
  "jti": "lt_8c2e",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" }
}
```

### 9.3 Keys and Algorithms

The License Server MUST publish its signing keys at `jwks_uri`. Resource Servers MUST resolve keys only from an issuer listed in their own Protected Resource metadata, MUST validate against an explicit algorithm allowlist, and MUST reject `alg: none` (RFC 8725 §3.1, §3.2). Asymmetric algorithms are REQUIRED; `ES256` is RECOMMENDED.

### 9.4 Lifetime

`exp` minus `iat` MUST NOT exceed the server's advertised `max_token_lifetime` and SHOULD NOT exceed 3600 seconds. For group and institutional Entitlements it MUST NOT exceed 3600 seconds, so that a removed member loses access within an hour (S4, §13.7), and SHOULD NOT exceed 1800 seconds. Short lifetimes are the primary mitigation for compromise; revocation is secondary.

### 9.5 Opacity for Clients

Clients MUST treat the token as opaque and MUST NOT parse it to make decisions. Only Resource Servers and the License Server parse it. A Client that wants to know what the Subject holds, or which Assets a token covers, reads the `entitlement` and `resource` members of the token response (§8.5), not the token body.

## 10. Entitlements

### 10.1 Types

| Type | Meaning |
|---|---|
| `access` | The Subject may receive the Assets the token's `resource` names |
| `limit` | The Subject may receive those Assets up to a quota the Resource Server counts (Profile C) |
| `status` | The Subject has a standing that changes treatment (ad-free, institutional, group member, patron). Grants no access by itself (§10.4). |

### 10.2 Fields

| Field | Type | Applies to | Description |
|---|---|---|---|
| `type` | string | all | REQUIRED. `access`, `limit`, or `status` |
| `coverage` | string | all | REQUIRED. `item` when the token's `resource` is an Asset identifier, `collection` when it is a scope (§5.5). It tells a Resource Server how to match `resource` (§10.4). |
| `kind` | string | all | OPTIONAL qualifier: `metered`, `locale-gated`, `pre-release`, `patron`, `institutional`, `ad-free`, `group-member`. Extensible. A Resource Server that does not recognize a value MUST treat the Entitlement as if no `kind` were present; an unrecognized `kind` never grants anything. |
| `duration` | string | access | `perpetual`, `recurring`, `time-limited`, or `rental`. Informational, except that `rental` requires `rental_expires_at`. The end of a `time-limited` Entitlement is enforced through `exp`: the License Server stops issuing when it ends. |
| `rental_expires_at` | integer | access, `duration: rental` | Unix time the rental ends. The License Server MUST NOT issue a token whose `exp` is later, and the Resource Server MUST refuse the token at or after it (§11.2). |
| `transferable` | boolean | access | Informational. Whether the Subject may hand the Entitlement to another Subject; the transfer happens at the License Server (§17.2), not in the protocol. Default `false`. |
| `quota` | integer | limit | Items allowed per period |
| `period` | string | limit | ISO 8601 duration of the quota window (`P1D`, `P1W`, `P1M`) |
| `remaining` | integer | limit | Items remaining in the current period at issuance. A snapshot; the Resource Server's count governs (Profile C, D7). |
| `source` | string | all | `direct`, `broker`, `institution`, `group` |
| `group_id` | string | source `institution` or `group` | Opaque identifier of the paying group |
| `offer` | string | all | OPTIONAL. The `id` of the Offer (§6.2) the Entitlement was obtained under. Informational. |

A validator checks `type`, then only the fields that apply to that type, and MUST reject a token whose `entitlement` is missing `type`.

### 10.3 Named Aliases (Informative)

These names are for documentation and interfaces, not protocol values. A Publisher-wide Entitlement is `collection` over the Publisher's root scope (`https://inkwell.example/`).

| Alias | type | coverage | kind | duration | source |
|---|---|---|---|---|---|
| Subscription | access | collection | | recurring | direct |
| Per-item purchase | access | item | | perpetual | direct |
| Rental | access | item | | rental | direct |
| Gift | access | item | | time-limited | direct, `transferable: true` |
| Trial | access | collection | | time-limited | direct |
| Bundle | access | collection | | perpetual | direct |
| Early access | access | collection | pre-release | time-limited | direct |
| Broker bundle | access | collection | | recurring | broker |
| Institutional access (S4) | access | collection | | recurring | institution |
| Metered | limit | collection | metered | | direct |
| Institutional status | status | collection | institutional | | institution |
| Group / family | status | collection | group-member | | group |
| Patron | status | collection | patron | | direct |
| Ad-free | status | collection | ad-free | | direct |

### 10.4 Entitlement and Coverage

The token's `resource` is what a Resource Server enforces, matched as `coverage` says: with `item`, the requested Asset MUST equal `resource`; with `collection`, it MUST begin with `resource` (§5.5). A Resource Server MUST refuse any other request with `403` and `insufficient_scope`. A License Server MUST set `coverage` to `item` exactly when `resource` is an Asset identifier, and to `collection` exactly when it is a scope.

The three types differ in what a Resource Server may do with a token that passes that check:

- `access`: serve the Asset.
- `limit`: serve the Asset while the Resource Server's own count for the Subject is under `quota` for the current `period` (Profile C).
- `status`: nothing by itself. A Resource Server MUST NOT serve a gated Asset on a `status` Entitlement alone. It uses the standing as an input to its own policy (ad-free rendering, institutional pricing, member-only discussion), which §11.2 permits.

`pre-release` is likewise a policy input: which Assets are pre-release is the Resource Server's knowledge, and `kind: pre-release` tells it the Subject may have them.

The Publisher's current Terms apply to every request regardless of what the token says; the token establishes who the Subject is and what they hold, not what the Publisher permits today.

## 11. Validation and Enforcement

### 11.1 Presenting a Token

A Client presents a DPoP-bound License Token with the `DPoP` scheme and a `DPoP` proof header, exactly as RFC 9449 §7.1 specifies:

```
Authorization: DPoP <token>
DPoP: <proof JWT>
```

A License Token that is not sender-constrained is presented with the `License` scheme:

```
Authorization: License <token>
```

`Bearer` MUST NOT be used. What marks a credential as a License Token is the JOSE header `typ: license+jwt` (§9.1), not the scheme, and a Resource Server MUST check `typ` under either scheme. The `License` scheme is the same one RSL uses for its tokens, so a server implementing both handles one header for unbound tokens.

### 11.2 Enforcing Checks

A Resource Server MUST, for each request for a gated Asset:

1. Verify the signature against the JWKS of an issuer listed in its own Protected Resource metadata (§9.3).
2. Verify `typ`, `iss`, `aud`, `exp`, and `iat`.
3. Determine the Asset the request serves or exercises: the `ope.asset` of the requested URL's Protected Resource metadata, or the URL itself (§5.6). Verify that `resource` covers that Asset as `entitlement.coverage` says (§10.4), and that `publisher` equals the Asset's `ope.publisher`.
4. Verify that the Entitlement permits serving (§10.4): its `type` is `access` or `limit`, a `limit` is within quota, and, when `duration` is `rental`, the current time is before `rental_expires_at`.
5. Verify `cnf` when present, per RFC 9449 or RFC 8705.
6. Check revocation: either the token is within a lifetime the Resource Server accepts without introspection (§12.3), or the Resource Server calls `/introspect`.

A Resource Server MAY validate locally. It MUST fall back to `/introspect` (RFC 7662) for any token it cannot validate locally. Local validation never grants more than introspection would.

Steps 1 to 6 establish that the token is genuine and that the Subject holds an Entitlement covering the Asset. They are the minimum decision. A Resource Server MAY apply further policy of its own (its Terms, time windows, locale, per-operation rules, group rules) using the token's claims as inputs to a policy engine or to application code. OPE delivers the principal (`sub`), the Asset (`resource`), and the context (`entitlement`, `terms`); how a Resource Server reasons over them beyond this section is its own business, provided the result is never more permissive than steps 1 to 6 allow.

### 11.3 Advisory Checks

A Client MAY inspect the token response it received to decide what to show the Subject. This is an advisory check. It is not enforcement, because a Client on the Subject's own device can be modified. Publishers MUST NOT rely on advisory checks to protect an Asset. For S1, the Asset (pro export) is protected because Inkwell's server checks the token before running the export, not because Margin shows a "pro" badge.

### 11.4 Responses and Errors

| Status | When | Client action |
|---|---|---|
| `401 Unauthorized` | No token; or the token is invalid, expired, or revoked | Obtain a token, or refresh |
| `402 Payment Required` | MAY be returned instead of `401` for a request with no token, to say the Asset is for sale | As for `401`; the Client MAY show the Offers first |
| `403 Forbidden` | The token is valid but does not cover the Asset, its Entitlement does not permit serving, a `limit` is spent, or the Resource Server's own policy refuses | Do not retry with the same token. On `insufficient_scope`, authorize for this Asset. On `no_entitlement`, show the Offers. |
| `503 Service Unavailable` | Introspection failed and local validation is not possible | Retry per `Retry-After` |

`401` and `402` responses MUST include a `WWW-Authenticate` challenge for each scheme the Resource Server accepts (§11.1), each with `resource_metadata` (§7.1). A challenge carries `error` only when the request carried a token: a request with no credentials gets a challenge with no error code (RFC 6750 §3.1). A License Token presented under a scheme the Resource Server does not accept for it, such as `Bearer` (§14, downgrade), counts as no credentials. `403` responses SHOULD carry the same challenge with `error`. v0.1's `OPE-*` response headers are withdrawn.

Error codes:

| Code | Returned by | Meaning |
|---|---|---|
| `invalid_token` | Resource Server, `401` | Token invalid, expired, or revoked (RFC 6750 §3.1) |
| `insufficient_scope` | Resource Server, `403` | Token valid, but its `resource` does not cover the Asset (RFC 6750 §3.1) |
| `quota_exceeded` | Resource Server, `403` | A `limit` Entitlement is spent for the current period (Profile C) |
| `no_entitlement` | License Server: authorization error response (RFC 6749 §4.1.2.1) or token endpoint `400` (RFC 6749 §5.2). Resource Server: `403` when the token covers the Asset but fails §11.2 step 4 (a `status`-only Entitlement, a rental past its end). | The Subject holds no Entitlement that lets them have the Asset. The Client shows the Offers and does not re-authorize for the same Asset. |
| `entitlement_suspended` | License Server, as for `no_entitlement` | The Subject's Entitlement is suspended (§17.2) |

## 12. Token Lifecycle

### 12.1 Refresh

A License Server that issues `refresh_token` MUST rotate it on use and MUST invalidate the previous value, for every Client. This is stricter than RFC 9700 §4.14, which requires rotation or sender-constraint, and only for public Clients. Invalidating the previous refresh token on rotation is not revocation (§12.2): access tokens already issued from it stay valid, which matters when one bundle refresh token serves several Publishers (§13.6). A refresh MUST re-check that the Entitlement is `active` (§17.2). Refresh tokens issued to public Clients MUST be sender-constrained (DPoP) or MUST expire within 30 days of last use.

### 12.2 Revocation

A License Server MUST expose `revocation_endpoint` conforming to RFC 7009. Parameters: `token` (REQUIRED), `token_type_hint` (OPTIONAL, `access_token` or `refresh_token` per RFC 7009 §2.1). Authentication: as RFC 7009 §2.1 specifies; a public Client identifies itself with `client_id`. Response `200` regardless of prior state (RFC 7009 §2.2). After revocation `/introspect` MUST return `active: false` for that token. Revoking a refresh token SHOULD also revoke the access tokens issued from it (RFC 7009 §2.1).

Publishers revoke through the License Server. A License Server MUST also support the operator actions in §17.3, including revocation by `sub`, `group_id`, `resource`, and `client_id`. How the operator triggers them is out of scope; their effects are not.

### 12.3 Bounding Revocation Delay

Because a locally validated token remains valid until `exp`, a License Server MUST document the interval it can tolerate between revocation and effect. A Resource Server that validates locally MUST NOT accept tokens whose remaining lifetime exceeds the interval it is willing to tolerate, and MUST introspect otherwise. The advertised `max_token_lifetime` is the upper bound of that interval for that issuer. A Resource Server whose tolerance is at or above the token lifetime never introspects, so revocation reaches it only through expiry; one that needs revocation to take effect sooner sets a tolerance below the lifetime.

### 12.4 Introspection

The License Server MUST expose `introspection_endpoint` conforming to RFC 7662. For an active token the response includes `active`, `token_type` (`DPoP` or `License`), `sub`, `client_id`, `aud`, `resource`, `publisher`, `terms`, `entitlement`, `exp`, `iat`, and `cnf` when the token is sender-constrained, so that an introspecting Resource Server can still verify the DPoP proof (RFC 9449 §6.2). Resource Servers authenticate to introspection with their own credentials (§13.4).

The request MAY include `resource`: the Asset identifier the Resource Server is deciding about. When it does, the response includes `permitted`, a boolean stating whether the token passes §11.2 steps 3 and 4 for that Asset, apart from the quota check, which only the Resource Server can make (Profile C). This is the same parameter and response member that RSL 1.0's introspection endpoint uses, so one endpoint can serve both specifications.

## 13. License Servers Operated for Others

A License Server may serve one Publisher or many: a platform hosting creators, a collective selling one subscription across many Publishers, a licensing agency, an institution's library system. This section is what such a server needs beyond a single-Publisher one. v0.1's separate broker subsystem is withdrawn; everything here is ordinary License Server behavior with more than one Publisher attached.

### 13.1 The Trust Relationship Is the Resource Metadata

A License Server is authorized to issue for an Asset if, and only if, both sides say so: its `issuer` appears in `authorization_servers` in the Asset's Protected Resource metadata (§7.1), and the Asset is covered by its own `protected_resources` (§7.2), as RFC 9728 §4 recommends cross-checking. There is no separate allowlist, registry, or broker agreement in the protocol. A Publisher grants the relationship by listing the server and ends it by removing it; a License Server accepts it by listing the Publisher's Assets. A Publisher cannot conscript a License Server by naming it, and a License Server MUST NOT fetch metadata for, or issue for, a requested `resource` its `protected_resources` does not cover. The one exception is a bundle identifier listed in the License Server's own `ope.bundles` (§13.6), which has no Protected Resource metadata: it is accepted at the authorization endpoint, and both checks then apply to each Asset the Client names at the token endpoint.

A License Server MUST NOT issue a token for a resource whose metadata it has not resolved, whose metadata does not list it, or whose metadata it cannot refresh within 24 hours. A Resource Server MUST resolve signing keys only from issuers its own metadata lists (§9.3), so a token from any other issuer fails at step 1 of §11.2 regardless of what the token claims.

### 13.2 Metadata and Terms Ingestion

A License Server MUST obtain each resource's Protected Resource metadata and Terms from the Publisher's published locations, not from a copy supplied out of band. It:

- MUST fetch the metadata for each Asset it issues for, and refetch at least every 24 hours (§7.3);
- MUST stop issuing for a resource whose metadata no longer lists it, or cannot be fetched;
- MUST fetch the Terms of each Offer, compute `sha256`, and place the reference in every token (§6.1, §9.2);
- MUST apply the `client_policy` from its most recent fetch at every issuance (§7.1);
- SHOULD revoke by `resource` when the Terms digest changes and the Publisher asks for outstanding tokens to be reissued under the new Terms.

### 13.3 Publishers Without Their Own Origin

A Publisher need not control a domain. A creator selling a course, a tool, or a newsletter through a platform is a Publisher whose Assets live under the platform's origin:

```
https://platform.example/creators/alice/courses/woodworking-101/lessons/01-tools
```

For such Publishers:

- the platform publishes Protected Resource metadata per URL (§7.1), such as `/.well-known/oauth-protected-resource/creators/alice/courses/woodworking-101/lessons/01-tools`, each carrying that creator's Publisher identifier (`https://platform.example/creators/alice/`), Offers, Terms, and `client_policy`;
- the License Server's `protected_resources` (§7.2) lists the creator's scope;

Two Publishers under one origin MUST have non-overlapping scopes (§5.5). The platform, not the creator, assigns scope prefixes. This puts the creator's metadata, and so their choice of License Server, in the platform's hands, and a creator who leaves the platform cannot take their Asset identifiers along (§5.2 asks that identifiers not change). OPE does not solve this in v0.2; a platform that wants to offer it can let creators sign their own metadata (RFC 9728 `signed_metadata`) or serve their Assets from a creator-controlled origin.

### 13.4 Resource Servers Operated by a Different Party

When the Resource Server belongs to the Publisher and the License Server does not, the Resource Server needs a way to call `/introspect` (RFC 7662 requires the endpoint to be protected but does not say how). A License Server:

- MUST offer at least one of: Resource Server registration through `registration_endpoint` (RFC 7591) with a software statement or `client_uri` on the Publisher's origin, or a credential issued out of band and recorded against the resource;
- MUST record, for each Resource Server credential, the Publisher identifiers (§5.8) it serves, and MUST return `active: false` when the introspected token's `publisher` is not among them; a Resource Server MUST NOT be able to introspect tokens for another Publisher's Assets, even on a shared origin;
- MUST serve `jwks_uri` without authentication, so that a Resource Server with no introspection credential can still validate locally.

A Resource Server with no introspection credential cannot introspect, so its tolerance (§12.3) MUST be at least the `max_token_lifetime` of every issuer its metadata lists; otherwise it would refuse even freshly issued tokens. Revocation then reaches it only through expiry.

### 13.5 Audience and Source

A License Server operated for others:

- MUST set `aud` from the Asset as §9.2 describes;
- MUST set `entitlement.source` to `broker` when the Subject's Entitlement was purchased from the operator (a collective subscription, a platform bundle) and to `direct` when the Subject purchased from the Publisher and the operator only issues;
- MUST NOT store or serve Asset content on the Subject's behalf beyond what is needed to complete a request.

### 13.6 Bundles Across Publishers

An Entitlement MAY cover Assets from more than one Publisher: a collective subscription, a platform pass. A License Server that sells one:

- issues tokens one Publisher at a time. Every token names exactly one `publisher` (§9.2), and its `resource` is that Publisher's Asset or a scope within it, so a Resource Server refuses it for any other Publisher's Asset at §11.2 step 3, even when two Publishers share an origin and so an `aud`;
- needs nothing new for the common case. A Client asks for an Asset as usual (§8.1); the License Server sees that the Subject's bundle covers it and issues a token for that Publisher with `source: broker` (§13.5) and the bundle's Terms. The Subject sees one consent per Publisher.

A License Server MAY also let a Client authorize the whole bundle at once. It then lists the bundle in `ope.bundles` (§7.2) with a bundle identifier: an `https` URL on the License Server's own origin. An authorization request whose `resource` is a bundle identifier:

- MUST show the bundle consent in §8.4, naming the bundle and every Publisher in it;
- never yields an access token for the bundle identifier itself. The Client names an Asset identifier as `resource` on the token request: at the code exchange for its first Publisher, then with the `refresh_token` grant for each further one. This uses the `resource` parameter on the token endpoint as RFC 8707 §2.2 does, but extends it: RFC 8707 narrows to resources named in the authorization request, while OPE lets the Client name any Asset the bundle covers;
- issues for that Asset if the bundle covers it and both trust checks pass (§13.1), and otherwise refuses with: `invalid_target` when the request names no Asset, names the bundle identifier, or names an Asset outside `protected_resources`; `no_entitlement` when the bundle no longer covers the Asset's Publisher; `unauthorized_client` (RFC 6749 §5.2) when the Publisher's `client_policy` refuses the Client;
- puts the bundle's Terms in the token's `terms` (§9.2). The Publisher's current Terms still govern every request (§10.4).

### 13.7 Groups and Institutions

Group and institutional Entitlements (`source: group` or `institution`, with `group_id`) require the License Server to know who is in the group. Membership is a License Server input, not a protocol message: it arrives by roster sync, directory federation, an administrator's action, or the operator's own interface. OPE requires only that:

- a change in membership MUST take effect at the next token request for the affected `sub`;
- removal from a group MUST trigger revocation by `sub` and `group_id` (§12.2), so that outstanding tokens die within `max_token_lifetime`;
- a Subject who is a member of a group and also holds a direct Entitlement for the same Asset receives the direct Entitlement; the group one is a fallback, not a merge.

### 13.8 Changing or Ending a Relationship

A Publisher MAY list more than one License Server in `authorization_servers`, and MAY remove one to end a relationship. Clients and License Servers refetch metadata within 24 hours (§7.3) and stop using the removed server. Tokens already issued remain valid until `exp`; a Publisher that wants them gone sooner asks the former License Server to revoke by `resource`, or sets its Resource Server tolerance to zero and introspects everything until the longest outstanding `exp` has passed.

Cross-Publisher browser flows are in the Web profile.

## 14. Security Considerations

This section is normative.

- **Transport.** All endpoints MUST use HTTPS. Tokens MUST NOT appear in URLs.
- **Storage.** Clients MUST keep tokens in platform-private storage. A site that holds a token for its own pages keeps it in an `HttpOnly; Secure; SameSite=Lax` cookie (Web profile). A browser-based Client acting for the Subject across sites, such as a single-page app or an extension, keeps tokens in memory or in extension-private storage. `localStorage` and `sessionStorage` MUST NOT be used.
- **Sender constraint.** Public Clients SHOULD use DPoP. A Resource Server that receives a token with `cnf` MUST verify the proof.
- **Lifetime.** §9.4 and §12.3. Non-expiring tokens are prohibited.
- **Audience.** Resource Servers MUST reject tokens whose `aud` does not include their origin (RFC 9700 §2.3).
- **Issuer binding.** A Resource Server MUST accept only issuers its own Protected Resource metadata lists (§7.1, §9.3). Never resolve keys from a URL found inside the token.
- **Redirect URIs.** Exact match, per RFC 9700 §4.1. Custom-scheme redirects for native apps per RFC 8252.
- **Consent.** §8.4. Auto-approve without consent is prohibited on first authorization.
- **Downgrade.** A Resource Server MUST NOT accept a License Token presented as `Bearer`, MUST NOT accept a token carrying `cnf` under the `License` scheme (a bound token presented without its proof), and MUST NOT accept an `at+jwt` token where a `license+jwt` is required.
- **Terms integrity.** The `terms` claim records what the Subject agreed to at issuance. The Publisher's current Terms govern every request (§10.4). A Resource Server that detects a digest mismatch SHOULD continue to serve under the current Terms and MAY ask the License Server to reissue.

## 15. Privacy Considerations

- `sub` MUST be an opaque, issuer-scoped identifier (§8.3). A License Server issuing for more than one Publisher SHOULD make `sub` pairwise per Publisher identifier (§5.8), so that two Publishers' Resource Servers cannot correlate one Subject across them, including two creators on one platform origin. `sub` MUST NOT vary by Client: S2 and §8.3 depend on one `sub` across Clients. The License Server holds the mapping and MUST still resolve every variant to one Entitlement.
- The `terms` claim is a URL and a digest, not the Terms themselves; it reveals nothing beyond the Asset's identity.
- Resource Servers SHOULD log `jti` and `client_id`, not `sub`, for access accounting.
- Advertising status (`kind: ad-free`) is sensitive; Clients MUST NOT expose it to third parties.
- Introspection reveals token status to anyone who can call it; License Servers MUST authenticate introspection callers.

## 16. Conformance Testing

A conforming v0.2 implementation MUST validate against the following, published alongside this specification:

- JSON Schema for the `ope` member of Protected Resource metadata (§7.1), including the Offer and Terms reference.
- JSON Schema for the `ope` member of Authorization Server metadata (§7.2) and for the `entitlement` object (§10).
- A set of signed test vectors: valid tokens, expired tokens, wrong `aud`, wrong `typ`, `alg: none`, issuer not listed in resource metadata, `resource` not covering the Asset, `publisher` not matching the Asset, a `status`-only token for a gated Asset, a rental past `rental_expires_at`, revoked `jti`, with expected Resource Server outcomes.
- For the Multi-Publisher License Server target: resource metadata not listing the issuer (MUST refuse to issue), requested `resource` outside its own `protected_resources` (MUST refuse without fetching), stale metadata older than 24 hours (MUST refetch or refuse), nested scopes of one Publisher (longer prefix wins), introspection of another Publisher's token (MUST refuse), an access token naming two Publishers or a bundle identifier (MUST NOT issue), `client_policy` deny (MUST refuse), group removal followed by a token request (MUST refuse), and the operator actions in §17.3 (each MUST be observable through `/introspect`).

Location: `conformance/` in the specification repository. *Status: the schemas and vectors are a v0.2 deliverable and are not yet published. This specification will not advance past Working Draft until they are.* An implementer who cannot run them should treat every MUST above as untested.

## 17. Entitlement Sources and Operator Actions

OPE says what an Entitlement looks like in a token. This section says where one comes from and what an operator must be able to do to it. Payment itself remains out of scope (§0.2); the join between a payment and an Entitlement is in scope, because every License Server has to build it.

### 17.1 The Entitlement Record

A License Server MUST keep, for each Entitlement, a record from which the `entitlement` claim is derived at issuance. The record is internal; its shape is the operator's. It MUST contain enough to answer, for any `sub` and `resource`: does an Entitlement exist, what are its type and fields (§10.2), what state is it in (§17.2), when did it last change, and what external event caused the change (an order, a renewal, a roster entry, a gift code, an administrator). Issuance MUST read the current record, never a copy cached from an earlier request.

### 17.2 Lifecycle States

| State | Meaning | Issuance |
|---|---|---|
| `active` | The Subject holds it | Permitted |
| `suspended` | Temporarily withheld (payment failed, dispute open, administrator hold) | Refused with `entitlement_suspended` (§11.4) |
| `ended` | Over (cancelled, expired, refunded, member left group) | Refused with `no_entitlement` (§11.4) |
| `transferred` | Given to another Subject (`transferable: true`) | Refused for the giver; the receiver has a new `active` record |

Transitions are driven by events outside OPE. OPE requires only that a transition out of `active` MUST trigger revocation of outstanding tokens for that `sub` and `resource` (§12.2), and that a transition into `active` MUST NOT reactivate previously revoked tokens.

### 17.3 Operator Actions

A License Server MUST support the following actions through an interface of the operator's design. The interface is not specified; the effects are.

| Action | Effect |
|---|---|
| Revoke by `jti` | One token dies; `/introspect` returns `active: false` |
| Revoke by `sub` | All tokens for a Subject die |
| Revoke by `sub` and `resource` | All tokens for one Subject on one Asset or scope die |
| Revoke by `group_id` | All tokens issued under a group Entitlement die |
| Revoke by `sub` and `group_id` | All of one Subject's tokens issued under a group Entitlement die (member removed, §13.7) |
| Revoke by `resource` | All tokens for an Asset or scope die (Terms change, Asset withdrawn) |
| Revoke by `client_id` | All tokens issued through a Client die (compromised or abusive Client) |
| Suspend and resume an Entitlement | §17.2; suspend revokes, resume does not reissue |
| Rotate signing keys | New `kid` published to `jwks_uri` before use; old key remains published until the longest outstanding `exp` has passed |
| Refuse issuance for a Publisher | Stop issuing for a scope without waiting for metadata to change |

Each action MUST take effect for new token requests immediately and for outstanding tokens within `max_token_lifetime`.

### 17.4 Records

A License Server SHOULD keep an append-only record of issuances (`jti`, `sub`, `client_id`, `resource`, `iat`, `exp`, `terms.sha256`, Entitlement state at issuance) and of operator actions, sufficient to answer "who was entitled to what, when, under which Terms, and why" for the Publishers it serves. Retention and access are the operator's policy. Records are not part of the protocol and MUST NOT be exposed through protocol endpoints.

## 18. IANA Considerations

OPE extends registries that OAuth and HTTP already maintain. None of these registrations has been requested yet; they will be filed before this specification advances past Working Draft (Roadmap). Until then every name below is provisional, and implementers SHOULD expect at most spelling changes.

| Registry | Entries | Defined in |
|---|---|---|
| OAuth Authorization Server Metadata (RFC 8414 §7.1) | `ope` | §7.2 |
| OAuth Protected Resource Metadata (RFC 9728 §8.1) | `ope` | §7.1 |
| JSON Web Token Claims (RFC 7519 §10.1) | `resource`, `publisher`, `terms`, `entitlement` | §9.2 |
| OAuth Token Introspection Response (RFC 7662 §3.1) | `resource`, `publisher`, `terms`, `entitlement`, `permitted` | §12.4 |
| OAuth Parameters (RFC 6749 §11.2) | `entitlement` and `resource` as token response parameters; `resource` as an introspection request parameter | §8.5, §12.4 |
| OAuth Extensions Error (RFC 6749 §11.4) | `no_entitlement`, `entitlement_suspended`, `quota_exceeded` | §11.4 |
| OAuth Access Token Types (RFC 6749 §11.1) | `License` | §8.5 |
| Media Types (RFC 6838) | `application/license+jwt`, the media type behind `typ: license+jwt` (RFC 8725 §3.11) | §9.1 |
| HTTP Field Names (RFC 9110 §16.3) | `Entitlement-Remaining` | Profile C |
| OAuth Authorization Details Types (RFC 9396) | `ope_entitlement` | Profile C |

The `License` HTTP authentication scheme is RSL's: RSL 1.0 §10.2 requests its registration in the HTTP Authentication Scheme Registry. OPE uses that registration rather than requesting its own (D12). RSL 1.0 does not request an access token type, so `License` as a `token_type` is OPE's request, to be coordinated with RSL. The `resource` introspection parameter and `permitted` member are RSL's too and will be registered jointly or by whichever specification files first.

---

# Part II: Profiles

Profiles specify how the core applies to a surface. Each is short by design and normative only where it says so. A profile MUST NOT weaken a core requirement.

## A. Feeds Profile

Applies to RSS 2.0, Atom (RFC 4287), and JSON Feed 1.1.

**OPE element.** A gated item carries an `ope:offer` element in namespace `https://feedspec.org/ope/ns/1.0` (unchanged from v0.1, D9) for each of the Asset's Offers, all naming the same `resource`. It names the Asset and repeats the Offer so a Client can present the item without a round trip; the Protected Resource metadata remains authoritative.

```xml
<item>
  <title>Interview: The Future of Open Podcasting</title>
  <enclosure url="https://cosmiccourier.example/ep42-preview.mp3" type="audio/mpeg" length="2400000"/>
  <podcast:alternateEnclosure type="audio/mpeg" length="54800000" title="Full episode (subscribers)">
    <podcast:source uri="https://cosmiccourier.example/ep42-full.mp3"/>
  </podcast:alternateEnclosure>
  <ope:offer resource="https://cosmiccourier.example/ep42-full.mp3"
             metadata="https://cosmiccourier.example/.well-known/oauth-protected-resource/ep42-full.mp3">
    <ope:name>Cosmic Courier Plus</ope:name>
    <ope:payment type="subscription" amount="5.00" currency="USD" period="P1M"/>
    <ope:purchase-url>https://cosmiccourier.example/subscribe</ope:purchase-url>
    <ope:entitlement-types>access status</ope:entitlement-types>
    <ope:terms>https://cosmiccourier.example/terms</ope:terms>
    <ope:preview-note>Preview clip. Subscribers hear the full 57 minutes.</ope:preview-note>
  </ope:offer>
</item>
```

| Element or attribute | Required | Meaning |
|---|---|---|
| `resource` attribute | REQUIRED | Asset identifier (§5) |
| `metadata` attribute | OPTIONAL | URL of the Asset's Protected Resource metadata (§7.1). A Client uses it only if it has the same origin as `resource`, and discards the document unless its `resource` is identical to the attribute (§7.1). |
| `id` attribute | OPTIONAL | Offer `id` (§6.2) |
| `ope:name` | REQUIRED | Offer name |
| `ope:payment` | REQUIRED | `type` REQUIRED; `amount`, `currency`, `period` OPTIONAL (§6.2) |
| `ope:purchase-url` | REQUIRED unless `type` is `free` or `institutional` | Where to buy |
| `ope:entitlement-types` | OPTIONAL | Space-separated subset of `access limit status`. Informational (§6.2). |
| `ope:terms` | REQUIRED | Terms URL (§6.1) |
| `ope:preview-note` | OPTIONAL | One line for unentitled display |

JSON Feed form, on the item: `_ope: { "resource": "...", "metadata": "...", "offers": [ ...Offer objects as in §6.2... ] }`. The underscore prefix is what JSON Feed reserves for extensions; v0.1's `extensions.ope` was not conformant and is withdrawn.

A Publisher that also publishes RSL MAY include its `rsl:` elements alongside; OPE Clients ignore them, and the two do not conflict.

**Gated media.** Publishers SHOULD use `podcast:alternateEnclosure` (Podcasting 2.0) to point at the full media, with the standard `<enclosure>` carrying a preview, so non-OPE players degrade gracefully. The full media URL is the Asset identifier. Publishers MAY return a signed, time-limited URL from the Resource Server instead of serving the canonical URL directly; the signed URL's expiry SHOULD match or exceed the token's.

**Removed from v0.1.** The `content_metadata` block (word count, read time, duration, series title, episode and season numbers, bitrate, item count, preview image). Word count and read time were presentation hints; series and episode fields duplicate Podcasting 2.0 and iTunes namespaces; price is now in the Offer; preview images belong in the item's own `<image>` or `itunes:image`.

**Batch retrieval.** Withdrawn from the core; a Resource Server MAY offer a batch endpoint and, if it does, MUST return partial results with per-item `status`. Documented in `profiles/feeds/batch.md`.

## B. Web Profile

Applies when a website unlocks its own gated pages in the Subject's browser: the site-mediated unlock. Here the site is both the Resource Server and an OAuth Client of the License Server. It runs the authorization flow from its server, as a confidential Client authenticated with a client secret or `private_key_jwt`, and the License Token is never handed to another Client: it stays at the site, or in the site's own `HttpOnly` cookie. A browser-based Client that reads across many sites, such as a web reader or an extension, is an ordinary public Client under §8.2; this profile does not apply to it.

**Signaling.** A page that gates content returns `401` or `402` with the `WWW-Authenticate` challenge(s) in §11.4. A page that returns `200` with a paywall MAY include the same challenge for discovery, but OPE Clients act on challenges only in `401` and `402` responses (§7.1). The page SHOULD include `<link rel="terms-of-service" href="<terms url>">` (RFC 6903) in `<head>`; `rel="license"` is for the content's own license (RFC 4946) and RSL documents, not for purchase terms. It SHOULD mark paywalled sections with Schema.org `isAccessibleForFree: false` and `hasPart` / `cssSelector` for search engines. v0.1's `OPE-Content-Id`, `OPE-Access-Level`, `OPE-Unlock-URL` headers and `rel="ope-discovery"` are withdrawn.

**Unlock flow.** The Subject follows a `purchase_url` or the page's own unlock link. The site checks for an existing session; otherwise it runs Authorization Code with PKCE against a License Server its metadata lists (which MAY be the site itself), validates the returned token per §11.2, and redirects to the Asset.

**Cookie transport.** After the unlock, the site keeps the Subject's access in a cookie: either its own session, established after validating the License Token, or the License Token itself. A token kept in a cookie is unbound, since a browser cannot attach a DPoP proof to a cookie; the site obtains it as an unbound token for its own `client_id`. The cookie is `HttpOnly; Secure; SameSite=Lax` with `Max-Age` no longer than the token lifetime. On an origin shared by several Publishers, its `Path` is the Publisher's scope prefix, so one creator's pages are not sent another's token. `Path` is not a security boundary against script running on the same origin; a platform that lets creators run script on its origin keeps tokens in its own session instead. The cookie name is site-defined; v0.1's default `ope_grant` is withdrawn as a protocol constant. Sites check, in order: their own session, the `Authorization` header (§11.1), then the cookie. The same validation logic (§11.2) applies to all three.

**Cross-Publisher flow.** Identical to the unlock flow with a third-party License Server (§13). The site redirects to that server's `authorization_endpoint` with `resource` set to the Asset and its own registered `redirect_uri`; the server authenticates the Subject, checks the Subject's holding covers this Asset, issues a token with `aud` set from the Asset (§9.2), and redirects back. The site validates per §11.2 and sets the cookie.

**CORS.** Both metadata documents and JWKS: `Access-Control-Allow-Origin: *`. A License Server's token, revocation, and registration endpoints serve public Clients, which may be native apps sending no `Origin`, extensions on `chrome-extension://` or `moz-extension://` origins, or single-page apps on any origin, so they allow any origin without credentials, relying on PKCE and DPoP rather than origin checks. CORS on Asset endpoints is the Resource Server's own policy.

## C. API and Feature Profile

Applies when the Asset is an API, a feature of a service, or an allotment (S1).

- The Asset identifier names the feature or API, not the tier (§5.7).
- The feature's own server is the Resource Server. It MUST publish Protected Resource metadata for the feature's identifier, so the Asset resolves (§5.4), and for each endpoint that exercises the feature, with `ope.asset` set to the feature's identifier (§5.6). It MUST perform the enforcing check (§11.2) on every call that exercises the feature. A Client MAY perform an advisory check to shape its interface (§11.3).
- Metered features use `type: limit` with `quota`, `period`, and `remaining`. The Resource Server is the source of truth for the count; `remaining` in the token is a snapshot at issuance. Resource Servers SHOULD return the current count in a response header `Entitlement-Remaining` (no `X-` prefix, per RFC 6648; registration in §18), listed in `Access-Control-Expose-Headers` for browser Clients, and MUST return `403` with `error="quota_exceeded"` when spent.
- Rich Authorization Requests (RFC 9396) with `type: "ope_entitlement"` MAY be used to request a specific Entitlement shape at authorization time.

## D. Agents Profile (Sketch)

Applies when a Client acts for a Subject under delegated, narrowed rights (S3). *This profile is a sketch in v0.2 and is not yet normative.*

- Delegation uses OAuth Token Exchange (RFC 8693). The Subject's Client presents the Subject's License Token as `subject_token`; the agent's `client_id` is the actor; the License Server issues a new License Token with `act: { "sub": "<agent client_id>" }` and an Entitlement no broader than the original.
- Narrowing is by `resource` (an Asset within the original scope), by `type` (an `access` may be exchanged for a `limit`), and by an OPTIONAL `entitlement.operations` array (`read`, `download`) whose grammar is open in v0.2.
- Machines acting for themselves do not use this profile.
- Open questions: whether `act` chains (agent of an agent) are permitted; audit expectations; how a Subject revokes delegated tokens without revoking their own.

## E. ATProto Profile (Deferred)

v0.1 §15 described integration with what ATProto then called permission spaces, and defined three lexicons under `org.feedspec.ope.*`. That work is now called **atproto spaces**. It entered public alpha on 2026-08-20 with a reference PDS, community PDS implementations, and alpha SDKs. Bluesky has said the alpha will see breaking changes, should not be used in production, and is targeted for launch later in 2026. As of this revision, credential format, repo serialization, commit signatures, DID document semantics, and the space URI syntax are all still changing.

v0.2 defers the profile until atproto spaces reaches a stable release. The v0.1 text is preserved in `profiles/atproto/v0.1-draft.md` for reference and is not normative; it predates the current design and should not be implemented.

Notes for the future profile (informative):

- Atproto spaces names subscription-only publishing as an intended use, so the overlap with OPE is direct.
- The likely mapping is: space authority to License Server, space membership to Entitlement, space credential to License Token. Whether OPE should wrap space credentials, issue alongside them, or simply describe how an OPE Resource Server admits space members is the main design question.
- The atproto spaces proposal moved space credentials from DPoP to HTTP Message Signatures in a revision of 2026-10-01; whether a released alpha has shipped the change is not confirmed here. OPE uses DPoP (§8.2, §11.1). The profile will need to bridge the two or explain why it does not need to.
- The `org.feedspec.ope.*` namespace was self-assigned and will be reconsidered when the profile is written.

Two v0.2 core decisions were made with ATProto in mind: Asset identifiers are defined as URIs, so a future profile can admit non-`https` ones once metadata exists for them (§5.2 requires `https` today), and `sub` is issuer-scoped rather than a DID, so a future profile can map either way.

---

# Part III: Roadmap, Examples, and Appendices

## Roadmap

| Item | Owner | Detail |
|---|---|---|
| **Conformance kit** | Editor | JSON Schemas and signed test vectors (§16). Gate for advancing past Working Draft. |
| **Second implementer** | Editor | One independent Client and one independent License Server (D8). Gate for advancing past Working Draft. |
| **IANA registrations** | Editor | File the registrations in §18, coordinating the shared `License` names with RSL. Gate for advancing past Working Draft. |
| **Alignment proposal to RSL** | Editor | OPE stands alone (§0.1 goal 5). Separately, four issues have been filed with RSL's Technical Steering Committee that would improve RSL for all users: public clients and sender-constrained tokens, a structured token profile on RFC 9068, an RFC 7009 revocation endpoint, and a JSON serialization of terms. Once OPE has independent implementations, the editor intends to propose to the TSC how an RSL License Server could add the OPE profile for human subjects, and how a Publisher's RSL document could serve as OPE Terms. Whether to pursue that is RSL's decision; OPE's roadmap does not depend on the answer. |

## Worked Example: S1, Pro Feature in a Third-Party App

A member buys the pro tier of *Inkwell*, a writing tool, and wants "pro export" to work inside *Margin*, a separate editor. A third party, *Lantern*, a subscription collective, operates the License Server for Inkwell.

**1. Metadata.** Inkwell publishes Protected Resource metadata at `https://inkwell.example/.well-known/oauth-protected-resource/features/pro-export`, the document in §7.1: `resource` is the feature, `authorization_servers` lists `https://license.lantern.example`, `ope.publisher` is `https://inkwell.example/`, and `ope.offers` has monthly and annual "Inkwell Pro" Offers whose Terms are Inkwell's own terms page. It also publishes metadata for the endpoint that exercises the feature, `https://inkwell.example/.well-known/oauth-protected-resource/api/export`, with `resource` set to `https://inkwell.example/api/export` and `ope.asset` set to the feature. Lantern lists `https://inkwell.example/` in its `protected_resources`.

**2. Discovery.** Margin resolves the feature (§5.4): it requests `https://inkwell.example/features/pro-export` with no token and receives `402` with `WWW-Authenticate: DPoP resource_metadata="https://inkwell.example/.well-known/oauth-protected-resource/features/pro-export"`, carrying no error code because the request carried no token (§11.4). It fetches the metadata, checks that its `resource` is the URL it requested, shows the two Offers, and fetches `https://license.lantern.example/.well-known/oauth-authorization-server`.

**3. Registration.** Margin is a public Client. It registers once via `registration_endpoint` and receives `client_id: margin_desktop` and no secret.

**4. Authorization.** Margin opens the system browser to `authorization_endpoint` with PKCE and `resource=https://inkwell.example/features/pro-export`. Lantern confirms the feature is in its `protected_resources` and that Inkwell's metadata lists it. The member signs in (the License Server federates to an OIDC provider), sees a consent screen naming Margin, "Inkwell Pro", and a link to Inkwell's terms, and allows.

**5. Token.** Margin exchanges the code, with a DPoP proof, and receives a `license+jwt` with `sub: s_3f9a1c`, `client_id: margin_desktop`, `aud: ["https://inkwell.example"]`, `resource` and `publisher` as above, `terms` with the digest of Inkwell's terms page, `entitlement: { type: access, coverage: item, duration: recurring, source: direct, offer: pro-monthly }`, and `exp` one hour out. The token response's `resource` tells Margin the token covers the feature alone.

**6. Use.** Margin calls `POST https://inkwell.example/api/export` with `Authorization: DPoP <token>` and a `DPoP` proof header. Inkwell's server confirms the issuer is in its own metadata and verifies the signature against the License Server's JWKS, then `typ`, `aud`, `exp`, and `iat`. The endpoint's `ope.asset` is the feature, which equals the token's `resource`, and `publisher` matches. The Entitlement is `access`, and `cnf` matches the proof. The token has 55 minutes remaining, under Inkwell's 60-minute local-validation tolerance, so Inkwell runs the export without introspecting.

**7. A second app.** The member later installs a different editor. It repeats steps 2 to 5 with its own `client_id`. The License Server issues a second token for the same `sub` and `resource`. There is still one subscription.

**8. Cancellation.** The member cancels. The Entitlement record moves to `ended`; the License Server revokes by `sub` and `resource`; `/introspect` returns `active: false`; new authorizations get `no_entitlement`. Because Inkwell's tolerance equals the token lifetime, it never introspects, and outstanding tokens stop working when they expire, within the hour (§12.3). If Margin had instead toggled "pro" locally without calling Inkwell's API, nothing in OPE would have stopped it; that is why §11.3 exists.

## Appendix A: Migration Notes (Informative)

| Platform pattern | v0.2 path |
|---|---|
| Private per-subscriber feed URLs (Substack, Supercast, Patreon tiers) | Publish one feed with `ope:offer` per gated item and Protected Resource metadata on the media origin; run or contract a License Server; replace per-subscriber URLs with Authorization Code + PKCE |
| HTTP Basic on feed URLs | Same, plus `podcast:alternateEnclosure` for full media |
| Platform-locked premium podcasts (Apple, Spotify) | Publish an OPE-enabled RSS feed alongside; the platform's own entitlement continues in parallel |
| Course platforms | One scope per course; lessons as Assets under the course prefix, each with its own metadata; the License Server issues `collection` tokens for the course scope |
| Existing site auth (Clerk, Auth0, custom) | Keep it. The License Server federates to it, or the site issues License Tokens after its own login (Web profile) |
| Publishers already using RSL | Point each Offer's `terms.url` at the RSL document with `type: application/rsl+xml`; add OPE's `ope` member to Protected Resource metadata; keep RSL's OLP for crawlers. An RSL License Server can also be the OPE License Server: its `issuer` is the RSL `server` URL, its `token_endpoint` is `<issuer>/token`, and one `/introspect` answers both (§12.4). |

## Appendix B: Implementer Guide (Informative)

**License Server (minimum):** RFC 8414 metadata with `protected_resources` and the `ope` member; Authorization Code + PKCE; `/token` returning `license+jwt` and the `resource` response member; `/revoke`; `/introspect`; JWKS; Protected Resource metadata ingestion (§13.2); an Entitlement record (§17). Reuse an existing OAuth server and add the token claims and the OPE-specific behaviors: choosing the token's `resource` (§5.6), and the `publisher`, `terms`, and `entitlement` claims. *Effort estimates from v0.1 are withdrawn until the conformance kit exists to measure against.*

**Resource Server (minimum):** Protected Resource metadata per gated URL with `ope.publisher` and `ope.offers` (and `ope.asset` for endpoints); §11.2 in a middleware; JWKS caching; a tolerance for local validation; `/introspect` fallback; `WWW-Authenticate` challenges with `resource_metadata` on 401/402.

**Client (minimum).** A Client that follows these steps meets the Client requirements of Part I:

1. **Reuse a token if one fits.** Tokens are cached by License Server `issuer` and by the `resource` and `coverage` from the token response. If a cached token covers the Asset (§10.4), present it (step 8) without fetching metadata; fetch metadata only if it is refused.
2. **Find the metadata.** Request the Asset, or read the item's `ope:offer`. On `401` or `402`, take `resource_metadata` from the challenge; from a feed, take `metadata` only if it is on the Asset's origin; otherwise construct the well-known URL (§7.1).
3. **Check it.** Discard the document unless its `resource` is identical to the URL requested or the feed's `resource`. Read `ope.asset` (default: `resource`), `ope.publisher`, `ope.offers`, and `authorization_servers`.
4. **Use a bundle if one applies.** If the Client holds a refresh token from a bundle authorization (§13.6) at a listed License Server, and that bundle's `publishers` include `ope.publisher`, refresh with `resource` set to the Asset and go to step 8. A Client learns of bundles from `ope.bundles` (§7.2); using them is optional.
5. **Choose a License Server.** Prefer one listed in `authorization_servers` that the Client is already registered with; otherwise the first one listed. If the Subject has a known account at one of several, the Client MAY let them choose.
6. **Register if needed.** Fetch its RFC 8414 metadata (§7.2). If the Client has no `client_id` there, register through `registration_endpoint`; if there is none, the Client needs a `client_id` issued out of band, and without one it returns to step 5 for the next listed License Server.
7. **Authorize.** Optionally show the Offers. Run Authorization Code + PKCE with `resource` set to the Asset (§8.1), with DPoP. On `no_entitlement`, show the Offers and open `purchase_url`; retry when the Subject returns (§6.2). On `entitlement_suspended`, tell the Subject; do not retry.
8. **Present.** Send the token with `Authorization: DPoP` (or `License` for unbound tokens) (§11.1).
9. **Handle refusals.** On `401` with `invalid_token`, refresh once, then re-authorize. On `403` with `insufficient_scope`, authorize for this Asset. On `403` with `no_entitlement`, show the Offers; do not re-authorize. On `403` with `quota_exceeded`, tell the Subject; do not retry. On `503`, retry per `Retry-After`.
10. **Refresh** before `exp`, sending the same `resource` the token was requested with (or, for a bundle, the Asset needed), and keep tokens in platform-private storage (§14).

**Reference implementations.** Eleventy demo (<https://github.com/shellen/ope-eleventy-demo>) targets v0.1 and will be updated. The reference gateway remains planned. Neither is a substitute for the conformance kit in §16.

## Appendix C: Changes from v0.1

Structural. v0.1 was 24 sections in one document. v0.2 is a core of 19 sections (§0 to §18), five profiles (one a sketch, one deferred), and appendices.

**Revision 5 (2026-10-27) within v0.2.** Review pass: fixes from two adversarial reviews and a cross-check against the RSL 1.0 text.

- *Discovery follows RFC 9728 exactly.* Protected Resource metadata is per URL, with `resource` identical to the requested URL (RFC 9728 §3.3), which revision 4's per-scope metadata could not satisfy. The new `ope.asset` names the Asset a URL serves or exercises, which also gives API endpoints a defined Asset (Profile C, worked example). Feed-supplied metadata URLs must be on the Asset's origin (§7.1).
- *Token coverage is decided by the License Server.* The Client requests one Asset; the token's `resource` is that Asset or a scope containing it, and the token response says which (§5.6, §8.5). One `resource` per request (§8.1). `coverage` is now `item` or `collection`, required for every type, and tells a Resource Server whether `resource` is a scope, since Asset identifiers may also end in `/`. `all` became a `collection` over the Publisher's root scope, and `pre-release` became a `kind` (§5.5, §10). A Publisher selling over a scope keeps its metadata uniform across it, so a scope token cannot bypass a per-Asset policy (§5.6). The token response must carry `resource` and `entitlement` (§8.5).
- *Publishers are identified.* New `ope.publisher` metadata member and `publisher` claim (§5.8). Scope separation, one Publisher per token, introspection isolation, and pairwise `sub` are stated against it. Bundles need nothing new in the common case. They may also be authorized with a bundle identifier and narrowed per Publisher at the token endpoint, an OPE extension of RFC 8707 §2.2. Bundles carry their own Terms and are exempt from the per-Asset trust checks only at the authorization endpoint (§13.1, §13.6).
- *Offers.* `ope.offers` is an array, Offers may carry an `id` echoed as `entitlement.offer`, and `entitlement_types` is informational (§6.2, §7.1).
- *Audience.* `aud` is the origin of `resource` plus any `ope.audience` origins (§9.2).
- *Trust is cross-checked from both sides.* RFC 9728's `protected_resources` replaces `ope.resources_served` and is required; a License Server does not fetch metadata for resources it does not list (§7.2, §13.1).
- *Enforcement.* §11.2 now has six steps: the request's Asset comes from metadata, `publisher` is checked, `status` grants no access by itself, and `rental_expires_at` is enforced. A Resource Server refuses step-4 failures with `no_entitlement`, so a `status`-only token does not loop the Client through re-authorization. Unknown `kind` values grant nothing (§10.2, §10.4). Group and institutional tokens MUST NOT live past an hour (§9.4). A Resource Server without an introspection credential sets its tolerance to the issuers' maximum lifetime (§13.4). Refresh-token rotation is not revocation (§12.1).
- *Errors.* `401` for a request without a token carries no error code (RFC 6750 §3.1), and `402` is an optional alternative to it. `no_entitlement`, `entitlement_suspended`, and `quota_exceeded` are defined, and the License Server refuses with OAuth error responses rather than `402` (§11.4, §17.2).
- *Introspection* returns `publisher` and `cnf`, and accepts RSL 1.0's `resource` parameter and `permitted` member (§12.4).
- *Terms digest.* The digest input is defined, and the 24-hour copy is the one shown at consent (§6.1).
- *Web profile.* The site is a confidential Client that keeps the token. Cookie tokens are unbound, and cookies are path-scoped on shared origins. Browser Clients that read across sites keep tokens in memory. CORS fits public Clients, and the profile uses `rel="terms-of-service"` (Profile B, §14).
- *Corrections.*
    - The License Token is identified by `typ`, not `token_type`, and is "modeled on" RFC 9068, not conforming to it (§2.2, §9.1).
    - `sub` is never pairwise per Client (§15).
    - S3 gates the Agents profile, not the core, and S5 is restated within token lifetimes (§0.3).
    - Asset identifiers must be `https` (§5.2).
    - The revocation hint is `access_token`, and refresh rotation is described as stricter than RFC 9700.
    - Citations fixed: RFC 8725 §3.2, RFC 8414 §3.1.
    - Revoke by `sub` and `group_id` added to §17.3.
    - The undefined "shortest tolerance" is replaced (§13.4).
- *New* §18 IANA Considerations. The text license is Apache 2.0 (D1 closed). D14 closed.

Known issues carried to revision 6:

- Request-target normalization before scope matching.
- Scoping revoke-by-`client_id` per Publisher at multi-Publisher servers.
- Emergency removal of a compromised signing key.
- Grant revocation on refresh-token replay.
- A channel-level `ope:offer` and several Assets per feed item.
- A normative mapping between the XML and JSON Offer shapes, with Atom and JSON Feed examples.
- `act` chaining in the Agents profile (D6).

**Revision 4 (2026-10-05) within v0.2.** Correctness pass. DPoP-bound tokens now use RFC 9449's `DPoP` scheme and `token_type`; revision 3's use of `License` for them conflicted with RFC 9449 (§8.5, §11.1, §14). Clients follow a `resource_metadata` URL when given and request the metadata's `resource` when metadata is published per scope (§5.6, §7.1); feeds may carry the metadata URL. Scopes may nest within a Publisher, longest prefix wins (§5.5; revision 3 forbade overlap and then gave an overlap rule). Durations in Offers and limit Entitlements are ISO 8601 (`P1M`, `PT72H`), removing the last numbers encoded in strings. Token response MAY carry `entitlement` for advisory display (§8.5, §9.5). `X-Entitlement-Remaining` renamed `Entitlement-Remaining` (RFC 6648). D13, D14 added.

**Revision 3 (2026-10-05) within v0.2.** OPE no longer depends on any specification outside OAuth and its RFCs. Replaced RSL-based discovery and trust with RFC 9728 Protected Resource Metadata (§7.1, §13.1); replaced the borrowed terms vocabulary with a Terms reference by URL and digest (§6.1) and an Offer object (§6.2); renamed the `license` claim to `terms`; moved `client_policy` into Protected Resource metadata (closes D10); renamed `ope.publishers` to `resources_served`; reframed §1.1 and the Roadmap as alignment with RSL rather than convergence into it; §2.2 keeps RSL's role names and says so. Token format otherwise unchanged; Clients from revision 2 need only follow `resource_metadata` instead of `Link rel="license"`.

**Revision 2 (2026-10-05) within v0.2.** Added for operators of License Servers serving more than one Publisher: §2.4 fourth conformance target; §8.2 Client review tier; §8.4 bundle consent; §11.2 minimum decision statement; §13 rewritten in full; §15 pairwise `sub` per audience; §16 multi-Publisher test vectors; §17 Entitlement sources and operator actions.

| v0.1 | v0.2 | Reason |
|---|---|---|
| No goals or acceptance stories | §0 added | Scope gate |
| §3.2 "RSL is adjacent" | §1.1: vocabulary aligned, independence stated, alignment proposal deferred to Roadmap | Accuracy without dependency |
| Terminology: Resource, Feed, Manifest, Grant, Grant Token, Client/reader, Publisher, Entitlement Broker, Content Metadata | Asset, Publisher, Terms, Offer, License Server, Resource Server, Client, Subject, License Token, Entitlement, Coverage | One name per thing; role names shared with RSL |
| `Resource` included "capability" | Withdrawn; "feature" | Collision |
| Discovery at `/.well-known/ope` (~10 nested objects) | RFC 9728 metadata per URL with one `ope` member (Asset, Publisher, Offers, audience, policy) and RFC 8414 metadata with `protected_resources` and one `ope` member (5 fields) | Reuse; unregistered well-known suffix withdrawn |
| Inline `auth` fallback | Removed | RFC 8414 is REQUIRED |
| Separate entitlement grant, refresh, revocation endpoints | OAuth `token_endpoint`, `refresh_token`, RFC 7009 `revocation_endpoint`, RFC 7662 `introspection_endpoint` | Reuse |
| Simple and Portable token modes | One mode: structured `license+jwt` | Simple mode could not be verified by third parties and did not meet the portability definition |
| JWT, PASETO, macaroons | JWT only, modeled on RFC 9068 (§9.1) | Surface area |
| `grant` claim with `type`, `scope`, `kind`, `duration`, `transferable`, `quota`, `period`, `source` | `entitlement` claim with `type`, `coverage`, `kind`, `duration`, `rental_expires_at`, `transferable`, `quota`, `period`, `remaining`, `source`, `group_id`, `offer`; the Assets covered are the token's `resource` | Rename `scope` to `coverage`; `rental:Nh` string replaced by a timestamp; `signal` renamed `status` |
| `content_ids`, `meter_remaining`, `institutional_domain`, `broker_id`, `bundle_id`, `refresh_token` as token claims | `resource` claim; `entitlement.remaining`; `entitlement.group_id`; `iss`; refresh token outside the token | RFC 9068 alignment; no secrets inside tokens |
| Own `content_metadata` vocabulary (16 fields) | Withdrawn; Offer carries price and name; Podcasting 2.0, iTunes, Schema.org carry the rest | Duplication |
| `required.level`, `grants_allowed`, `<ope:grant-types>` | `ope:offer` with `ope:entitlement-types`; Terms by reference | Three names for one idea; `level` never enumerated |
| JSON Feed `extensions.ope` | `_ope` | JSON Feed conformance |
| Atom/RSS `<ope:access>` with metadata children | `<ope:offer>` | Economy |
| `Authorization: Bearer <grant_token>` | `Authorization: DPoP <token>` for bound tokens (RFC 9449); `Authorization: License <token>` otherwise | RFC 9449 conformance; `typ` marks the credential; `License` scheme shared with RSL |
| `OPE-Content-Id`, `OPE-Access-Level`, `OPE-Unlock-URL`, `rel="ope-discovery"` | `WWW-Authenticate` challenges with `resource_metadata` (RFC 9728) | Reuse; unregistered headers withdrawn |
| Cookie name `ope_grant` as default | Site-defined | Product-adjacent constant removed |
| §13 Multi-Publisher Session Management | Client conformance notes in §4 and Appendix B | Implementation guidance, not protocol |
| §14 Entitlement Brokers: `broker_support`, allowlists, broker JWKS, broker authorization endpoint | §13: a broker is a License Server listed in the Publisher's Protected Resource metadata | `authorization_servers` already expresses this |
| §15 ATProto lexicons | Deferred to Profile E; text preserved non-normatively | Depends on an unfinished system and a self-assigned namespace |
| §21.4 payment landscape, §23 Why OPE Matters | §1.2 and §0 | Economy |
| §19 effort estimates | Withdrawn pending conformance kit | Unmeasured claims |
| No conformance suite | §16 names required schemas and vectors; gate for advancing | Verification |
| No license, changelog, or roadmap | Front matter, Appendix C, Roadmap | Provenance |

## Appendix D: Open Questions and Contested Items

| # | Item | Owner | Resolve by |
|---|---|---|---|
| D1 | *Closed in revision 5.* The text is licensed under the Apache License 2.0, as is everything else in the repository. | | |
| D2 | Offer `payment.type` values. Six are defined, aligned with RSL where RSL has the word. Decide whether `rental` and `institutional`, which RSL lacks, should be proposed to RSL or remain OPE-only. | Editor | With the alignment proposal |
| D3 | Terms `sha256` on content that varies by viewer (localized pages, A/B tests). Decide whether the digest should be of a canonical representation the Publisher nominates. | Editor | v0.3 |
| D4 | Non-`https` Asset identifiers (§5.2), and scope matching for them (§5.5). Needs a discovery path, since RFC 9728 metadata requires `https`, and depends in part on atproto spaces' URI syntax. Revisit once that settles. | Editor, with ATProto community | Profile E revival |
| D5 | Whether §5.2(3) should make query components MUST NOT rather than SHOULD NOT. | Editor | v0.3 |
| D6 | Agents profile: `act` chaining, `operations` grammar, delegated revocation (Profile D). | Editor | v0.3 |
| D7 | Whether `remaining` belongs in the token at all, given the Resource Server is the source of truth (Profile C). | Editor | v0.3 |
| D8 | Second implementer. No party other than the editor's own projects has implemented OPE. The specification SHOULD NOT advance past Working Draft without one independent Client and one independent License Server. | Editor | Ongoing |
| D9 | Namespace `https://feedspec.org/ope/ns/1.0` is retained for the feed element despite the spec being 0.2. Decide whether to version the namespace at 1.0 or move to a permanent unversioned namespace. | Editor | v0.3 |
| D10 | *Closed in revision 3.* Publisher-side Client allow/deny lists now live in `ope.client_policy` in Protected Resource metadata (§7.1). | | |
| D11 | Resource Server introspection credentials (§13.4). Two mechanisms are allowed; decide whether to require DCR with a software statement so that any Publisher's Resource Server can onboard without an out-of-band step. | Editor | v0.3 |
| D12 | The `License` HTTP authentication scheme is defined by RSL, whose §10.2 requests its IANA registration; OPE relies on that request (§18). Still open: whether RSL also registers `License` as an OAuth access token type, or OPE requests it. | Editor | With the alignment proposal |
| D13 | With DPoP-bound tokens on the `DPoP` scheme, `License` applies only to unbound tokens, which §8.2 discourages for public Clients. Decide whether to keep the `License` scheme at all, or require DPoP and drop it. | Editor | v0.3 |
| D14 | *Closed in revision 5.* RFC 9728 §5.1 says `resource_metadata` MAY be used with schemes other than Bearer, naming DPoP; it is usable with `DPoP` and `License` challenges as written. | | |

## Appendix E: References

**Normative.** RFC 2119, RFC 8174 (requirement language). RFC 3986 (URI). RFC 6749 (OAuth 2.0). RFC 6750 (Bearer Token Usage: error codes). RFC 7009 (Token Revocation). RFC 7517 (JWK). RFC 7519 (JWT). RFC 7591 (Dynamic Client Registration). RFC 7636 (PKCE). RFC 7662 (Token Introspection). RFC 8252 (OAuth for Native Apps). RFC 8414 (Authorization Server Metadata). RFC 8707 (Resource Indicators). RFC 8725 (JWT BCP). RFC 9068 (JWT Profile for Access Tokens). RFC 9110 (HTTP Semantics). RFC 9449 (DPoP). RFC 9700 (OAuth 2.0 Security BCP). RFC 9728 (OAuth 2.0 Protected Resource Metadata). ISO 4217 (currency codes). ISO 8601 (durations).

**Informative.** Really Simple Licensing 1.0 (rslstandard.org/rsl, 2025-12-10). RFC 4287 (Atom). RFC 4946 (Atom License Extension). RFC 6648 (Deprecating the X- prefix). RFC 6838 (Media Type Registration). RFC 6903 (Additional Link Relation Types: `terms-of-service`). RFC 8615 (Well-Known URIs). RFC 8693 (Token Exchange). RFC 8705 (mTLS). RFC 9126 (PAR). RFC 9396 (RAR). OpenID Connect Core 1.0. JSON Feed 1.1. Podcasting 2.0 namespace (podcastindex.org). Schema.org CreativeWork paywall markup. AT Protocol specifications. Atproto spaces proposal (github.com/bluesky-social/proposals, 0016) and alpha announcement (atproto.com/blog/atproto-spaces-alpha, 2026-08-20). x402. Web Monetization (WICG). ODRL. Creative Commons.

## Acknowledgments

Thanks to Max Engel for feedback on OAuth alignment, token architecture, and revocation enforcement. Thanks to the Really Simple Licensing Technical Steering Committee, whose vocabulary this specification shares. Thanks to the ATProto team, particularly Daniel Holmgren, for the design work, now atproto spaces, that informed v0.1 §15 and Profile E.

## Editor

Jason Shellen <https://shellen.com>. ATProto / Bluesky: @shellen.com.

feedspec.org is a project by Jason Shellen. Contribute at <https://github.com/shellen/open-portable-entitlement>.
