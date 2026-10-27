# Open Portable Entitlement (OPE)

**Draft Specification v0.2**

| | |
|---|---|
| **Status** | Working Draft |
| **Version** | 0.2, revision 4 (supersedes 0.1, 2026-03-27) |
| **Date** | 2026-10-05 (revision 1: 2026-09-24; revisions 2 and 3: 2026-10-05) |
| **Editor** | Jason Shellen <https://shellen.com> (@shellen.com on ATProto / Bluesky) |
| **Canonical URL** | <https://feedspec.org/ope/spec/> |
| **Source** | <https://github.com/shellen/open-portable-entitlement> |
| **Issues** | <https://github.com/shellen/open-portable-entitlement/issues> |
| **Changelog** | Appendix C, and `CHANGELOG.md` in the repository |
| **License** | Proposed: CC BY 4.0 for the text. *Open until the editor confirms; see Appendix D.* |
| **Depends on** | OAuth 2.0 and the RFCs listed as normative in Appendix E. No other specification is required to implement OPE. |

*OPE lets a person prove they are entitled to something and carry that proof across the apps they choose. It is built from OAuth 2.0 and its published extensions and adds only what they lack: a way to issue, carry, and check an entitlement held by a person, for any kind of Asset, across organizations.*

---

## Status of This Document

This is a Working Draft published by the editor for review by feed and podcast client developers, publishing platforms, independent creators, and decentralized protocol communities. It may change substantially before wider review.

v0.2 is a restructuring release. It does not add capabilities. It shrinks the normative core to OAuth plus a small set of OPE-defined claims and objects, aligns its vocabulary with Really Simple Licensing (RSL) so that implementers of both use one set of words, and moves surface-specific material into profiles. Implementers of v0.1 should read Appendix C before anything else.

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

The core is considered complete for v0.2 if a conforming implementation can satisfy all five. Each story names the requirement it tests.

| # | Story | Tests |
|---|---|---|
| S1 | A member buys the pro tier of a tool and uses pro features inside a third-party app. | Asset identifiers for non-documents; enforcement at the tool's server, not the app. |
| S2 | A reader subscribes to a newsletter once and reads paid issues in two different feed readers without subscribing twice. | Portability across Clients; one `sub`, many `client_id`s. |
| S3 | A listener lets an AI assistant read premium episodes on their behalf but not buy anything. | Delegation with narrowed entitlement (Agents profile). |
| S4 | A school buys access for 200 students to a creator's course; a student leaves and loses access within an hour. | Group entitlement; revocation; short lifetimes. |
| S5 | A publisher's License Server is down for ten minutes and Resource Servers keep honoring tokens issued earlier that day. | Local validation of structured tokens. |

Measurable definition of "portable" used throughout: *a License Token issued to a subject through one Client can be validated by a Resource Server without that Resource Server contacting the Client, and the same subject can obtain a token for the same Asset through a second Client without the Publisher creating a second subscription.*

## 1. Introduction

Publishing stacks bundle content, payment, and distribution. A subscription bought in one app is locked to that app. OPE separates entitlement from the rest so that the proof of access travels with the person.

OAuth 2.0 already issues tokens to people through the Authorization Code flow, with PKCE for Clients that cannot keep a secret, and has published ways to discover endpoints (RFC 8414), discover which servers may issue for a resource (RFC 9728), name the resource a token is for (RFC 8707), structure the token so a stranger can check it (RFC 9068), refresh it, revoke it (RFC 7009), and introspect it (RFC 7662). None of these knows what an entitlement is.

OPE is the profile that adds that knowledge: a Subject claim that names a person rather than an application, an Entitlement claim that says what they hold, a reference to the Publisher's terms, an Offer object so a Client can show what is for sale before asking, and the rules a Resource Server follows to check all of it. Everything else is OAuth as published.

### 1.1 Relationship to Really Simple Licensing

Really Simple Licensing (RSL) is a specification for publishers to declare machine-readable terms for their content, with a companion protocol (OLP) under which a License Server issues license tokens to crawlers and agents that authenticate with a client secret.

OPE and RSL share a problem shape and, by design, a vocabulary. §2.2 defines OPE's roles using the same words RSL uses (Asset, Publisher, License Server, Resource Server, Client, License Token), and §11.1 uses the same `License` HTTP authentication scheme for tokens that are not sender-constrained, so that a server implementing both does not need two sets of names. Where RSL has the right word, OPE uses it rather than coining another.

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
| **Asset** | Anything a Publisher gates and identifies by an absolute URI: a document, a media file, a feature of a service, an API, a seat, a bundle, an allotment. See §5. |
| **Publisher** | The party that controls an Asset and decides who may have it. May be an organization or an individual. May publish under its own origin or under another party's (§13.3). |
| **Terms** | The Publisher's statement of what is permitted, prohibited, and charged for an Asset, in whatever form the Publisher chooses. OPE references Terms by URL (§6.1); it does not define their contents. |
| **Offer** | A small machine-readable object stating what a Client needs to present an Asset for purchase: payment type, amount, where to buy, and which Entitlement types the Publisher will issue (§6.2). |
| **License Server** | A web service acting as an OAuth 2.0 Authorization Server that authenticates Subjects and issues, refreshes, revokes, and introspects License Tokens. May be operated by the Publisher or by another party (§13). |
| **Resource Server** | The server or CDN that serves an Asset and enforces access by checking License Tokens. |
| **Client** | An application that obtains and presents License Tokens on behalf of a Subject: a feed reader, podcast player, browser, browser extension, or agent. |
| **Subject** | The person who holds an Entitlement. Identified by the `sub` claim. Distinct from the Client that presents the token. |
| **License Token** | An OAuth access token with `token_type` `License`, structured as §9 defines and presented with the `License` HTTP authentication scheme. |
| **Entitlement** | The Subject's holding: what kind of access they have, over what coverage, for how long, from what source. Carried in the `entitlement` claim (§10). |
| **Coverage** | The set of Assets an Entitlement applies to: one, a collection, everything the Publisher offers, or pre-release items. Called `scope` in v0.1; renamed to avoid collision with the OAuth `scope` parameter. |
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

- **OPE License Server:** implements §7.2, §8, §9, §10, §12, §17, and the License Server requirements of §11 and §14.
- **OPE Multi-Publisher License Server:** an OPE License Server that issues for Assets belonging to more than one Publisher. Additionally implements §13 in full.
- **OPE Resource Server:** implements §5 comparison rules, §7.1, §11, and the Resource Server requirements of §9, §13.4, and §14.
- **OPE Client:** implements §7 discovery, §8 authorization, §12 lifecycle, and the Client requirements of §11 and §14.

Profiles (Part II) define additional conformance for specific surfaces. An implementation MAY claim core conformance without any profile.

## 3. Inventory: What OPE Reuses and Why

This section is informative. It records what was examined so that nothing here is claimed as new when it is not.

| Existing work | What it does | OPE's use |
|---|---|---|
| OAuth 2.0 (RFC 6749), PKCE (RFC 7636), Native Apps (RFC 8252), Security BCP (RFC 9700) | Authorization for people through Clients that may be public | Adopted as the only authorization path. |
| Protected Resource Metadata (RFC 9728) | A resource server publishes which authorization servers may issue for it, and 401 responses point there | Adopted as discovery and as the trust relationship between Publisher and License Server. OPE adds one extension member for Offers. |
| Authorization Server Metadata (RFC 8414), Dynamic Client Registration (RFC 7591) | Discovery of endpoints; registration of Clients without a human in the loop | Adopted. OPE metadata is carried as one extension member; no new well-known suffix. |
| Resource Indicators (RFC 8707) | `resource` parameter naming the target of a token | Adopted as the Asset identifier carrier. |
| JWT Profile for Access Tokens (RFC 9068), JWT BCP (RFC 8725) | Structured, locally validatable tokens | Adopted as the License Token format with one added claim set. |
| Token Revocation (RFC 7009), Introspection (RFC 7662) | Ending and checking tokens | Adopted unchanged. |
| DPoP (RFC 9449) | Binding a token to a Client key | RECOMMENDED for public Clients. |
| Token Exchange (RFC 8693) | Delegation with narrowed rights | Used by the Agents profile. |
| OpenID Connect Core 1.0 | Identity of the Subject | A License Server MAY federate authentication to an OIDC provider; OPE does not define identity. |
| Really Simple Licensing (RSL 1.0) | Machine-readable terms for publishers; OLP for licensing crawlers and agents | Vocabulary aligned (§2.2); `License` auth scheme shared for unbound tokens (§11.1); a Publisher's RSL document is a valid Terms URL (§6.1); payment type values aligned (§6.2). Not required. |
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
2. Client fetches the Asset's Protected Resource metadata (RFC 9728): License Servers, Terms, Offer
3. Client fetches the License Server's Authorization Server metadata (RFC 8414)
4. Client sends the Subject through Authorization Code + PKCE with resource=<Asset URI>
5. License Server authenticates the Subject, checks the Entitlement, issues a License Token
6. Client presents the token to the Resource Server (Authorization: DPoP, or License if unbound)
7. Resource Server validates locally or by /introspect and serves, or returns 401/402/403
8. Client refreshes before expiry; License Server revokes when the Entitlement ends
```

A Client MUST NOT assume it is the only Client the Subject uses. A License Server MUST be able to issue tokens for the same Subject and Asset to more than one Client without creating more than one Entitlement.

## 5. Asset Identifiers

### 5.1 Purpose

Every Entitlement is for something. This section defines how that something is named so the same identifier appears in the Publisher's metadata, the authorization request, and the License Token, whatever kind of thing it is.

### 5.2 Requirements

1. An Asset identifier MUST be an absolute URI (RFC 3986 §4.3).
2. An Asset identifier SHOULD be an `https` URL that resolves as described in §5.4.
3. An Asset identifier MUST NOT include a fragment and SHOULD NOT include a query component, matching RFC 8707 §2.
4. A Publisher MUST NOT reassign an Asset identifier to a different Asset.
5. If an Asset moves, its identifier SHOULD stay the same. Identity is not location; the old URL MAY redirect.

### 5.3 Comparison

Asset identifiers are opaque. Clients, License Servers, and Resource Servers MUST compare them by simple string comparison (RFC 3986 §6.2.1) and MUST NOT infer meaning from their structure. Publishers SHOULD publish identifiers in normalized form so that string comparison is reliable.

### 5.4 Resolution

When an Asset identifier is an `https` URL, a request to it SHOULD return one of:

- the Asset, if the request carries a valid License Token or the Asset is free;
- `401` or `402` with a `WWW-Authenticate` challenge carrying `resource_metadata` (RFC 9728 §5), pointing at the Asset's Protected Resource metadata;
- for Assets that are not documents, a short description of the Asset with the same header.

Resolving the identifier is how a Client discovers that an Asset is gated and where to obtain a token. No feed is required.

### 5.5 Scopes

An Entitlement MAY cover a set of Assets rather than one. A scope is identified by an `https` URL prefix ending in `/`, and an Asset is in scope if its identifier begins with that prefix by simple string comparison. Scopes MAY nest within one Publisher (a course inside a creator's catalog); where more than one scope matches an Asset, the longest prefix governs it. Scopes belonging to different Publishers MUST NOT nest or overlap. Scope matching is defined only for `https` identifiers in v0.2.

### 5.6 One Identifier, Three Places

The same value MUST be used in each of:

| Place | Field | Source |
|---|---|---|
| Protected Resource metadata | `resource` | RFC 9728 §2 |
| Authorization and token requests | `resource` | RFC 8707 |
| License Token | `resource` claim | §9 |

When a Publisher publishes metadata for a scope rather than for each Asset, the `resource` in the metadata is the scope. A Client MUST then send that scope value as `resource` in its authorization and token requests, not the Asset identifier it started from. The token's `resource` is the scope, and the Resource Server matches requested Assets against it (§5.5).

### 5.7 Non-Goals

An Asset identifier names the Asset. It does not carry terms. Tiers, limits, durations, and prices belong in the Offer and the Entitlement, never in the URI. `https://inkwell.example/features/pro-export` is a valid identifier. `https://inkwell.example/features/pro-export?tier=gold&limit=1000` is not.

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
| `sha256` | REQUIRED in tokens, OPTIONAL in metadata | base64url SHA-256 of the body served at `url` at the time of issuance, so that later changes are detectable |
| `type` | OPTIONAL | Media type of the body. A Publisher using RSL sets `application/rsl+xml`. |

A License Server MUST fetch the Terms at issuance (or hold a copy fetched within the last 24 hours), compute `sha256`, and place the reference in the token's `terms` claim (§9.2). A Resource Server MAY compare the token's `sha256` with the current Terms to detect that Terms have changed since issuance (§14, terms integrity). Clients SHOULD show the Subject a link to `url` on the consent screen (§8.4).

### 6.2 Offers

A Client needs to show a Subject what is for sale before sending them to authorize. The Offer object carries the minimum for that. It is not a terms vocabulary; it is a shop window.

```json
{
  "name": "Inkwell Pro",
  "payment": { "type": "subscription", "amount": "8.00", "currency": "USD", "period": "P1M" },
  "purchase_url": "https://inkwell.example/pro",
  "entitlement_types": ["access"],
  "terms": { "url": "https://inkwell.example/terms/pro" },
  "preview_note": "Pro export, version history, and priority support."
}
```

| Member | Required | Meaning |
|---|---|---|
| `name` | REQUIRED | Human-readable name of what is being offered |
| `payment.type` | REQUIRED | One of `subscription`, `purchase`, `rental`, `free`, `contribution`, `institutional`. These values are the same words RSL uses where RSL has them, so that a Publisher using both writes them once. |
| `payment.amount`, `payment.currency` | OPTIONAL | Decimal string and ISO 4217 code. Omit for `free` and `institutional`. |
| `payment.period` | OPTIONAL | Billing period for `subscription`, or rental length for `rental`, as an ISO 8601 duration (`P1M`, `P1Y`, `PT72H`) |
| `purchase_url` | REQUIRED unless `type` is `free` or `institutional` | Where a Subject with no Entitlement goes to get one. A Client opens it in a browser. |
| `entitlement_types` | REQUIRED | Which of `access`, `limit`, `status` the Publisher will issue (§10) |
| `terms` | REQUIRED | Terms reference (§6.1) |
| `preview_note` | OPTIONAL | One line for unentitled display |

An Offer appears in the Asset's Protected Resource metadata (§7.1) and MAY be repeated in feeds (Feeds profile). An Offer is informational; the Entitlement in the token is what the Resource Server enforces.

## 7. Discovery

OPE uses two published OAuth discovery documents and adds one extension member to each. No OPE-specific well-known location exists.

### 7.1 Protected Resource Metadata (Asset side)

A Resource Server serving gated Assets MUST publish OAuth 2.0 Protected Resource Metadata (RFC 9728). The document says which License Servers may issue for the resource and carries OPE's Offer.

Location is as RFC 9728 §3 specifies: `/.well-known/oauth-protected-resource` at the origin for the whole origin, or `/.well-known/oauth-protected-resource/<path>` for a resource or scope at `<path>`. A platform hosting many Publishers under one origin uses the path form, one document per Publisher's scope (§13.3).

```json
{
  "resource": "https://inkwell.example/features/pro-export",
  "authorization_servers": ["https://license.lantern.example"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://inkwell.example/docs/api",
  "ope": {
    "version": "0.2",
    "offer": {
      "name": "Inkwell Pro",
      "payment": { "type": "subscription", "amount": "8.00", "currency": "USD", "period": "P1M" },
      "purchase_url": "https://inkwell.example/pro",
      "entitlement_types": ["access"],
      "terms": { "url": "https://inkwell.example/terms/pro" }
    },
    "client_policy": { "allow": ["*"], "deny": [] }
  }
}
```

| `ope` member | Required | Meaning |
|---|---|---|
| `version` | REQUIRED | OPE version implemented |
| `offer` | REQUIRED | The Offer (§6.2) for this resource or scope |
| `client_policy` | OPTIONAL | `allow` and `deny` lists of `client_id` values or `client_uri` domains. A License Server MUST honor a Publisher's `deny` and MUST NOT issue for a Client not matched by `allow`. Default allows all. |

`authorization_servers` is the trust relationship between Publisher and License Server (§13.1). A License Server MUST NOT issue for a resource whose Protected Resource metadata does not list its `issuer`, and a Resource Server MUST NOT accept tokens from an issuer its own metadata does not list.

On `401` and `402`, the Resource Server MUST include a `WWW-Authenticate` challenge with `resource_metadata="<url of this document>"` (RFC 9728 §5), so a Client that arrived at the Asset with no other context can find everything above. A Client MUST use a `resource_metadata` URL when one is given, by challenge or by feed (Feeds profile). Constructing the well-known URL from the Asset identifier (RFC 9728 §3.1) is a fallback only, and does not find metadata published for a scope.

### 7.2 Authorization Server Metadata (License Server side)

An OPE License Server MUST publish OAuth 2.0 Authorization Server Metadata (RFC 8414) at `<issuer>/.well-known/oauth-authorization-server`.

The metadata MUST include `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `revocation_endpoint`, `introspection_endpoint`, `code_challenge_methods_supported` (including `S256`), and `grant_types_supported` (including `authorization_code` and `refresh_token`). It SHOULD include `registration_endpoint` (RFC 7591) and `dpop_signing_alg_values_supported` (RFC 9449).

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
  "ope": {
    "version": "0.2",
    "entitlement_types_supported": ["access", "limit", "status"],
    "resources_served": ["https://inkwell.example/", "https://platform.example/creators/alice/"],
    "max_token_lifetime": 3600,
    "profiles": ["feeds", "web", "api"]
  }
}
```

| `ope` member | Required | Meaning |
|---|---|---|
| `version` | REQUIRED | OPE version implemented |
| `entitlement_types_supported` | REQUIRED | Subset of `access`, `limit`, `status` |
| `resources_served` | OPTIONAL | Origins or URL prefixes this License Server issues for. Present when the operator is not the Publisher (§13). |
| `max_token_lifetime` | REQUIRED | Longest `exp` minus `iat` this server issues, in seconds |
| `profiles` | OPTIONAL | Profiles from Part II this server supports |

Servers MAY continue to serve v0.1's `/.well-known/ope` during transition; it is not part of v0.2 conformance.

### 7.3 Caching

Clients SHOULD cache both metadata documents for no less than one hour and no more than 24 hours, honoring `Cache-Control`. Resource Servers SHOULD cache JWKS documents per their `Cache-Control` and MUST refetch on an unknown `kid`. License Servers MUST refetch a resource's Protected Resource metadata at least every 24 hours and before issuing if the cached copy is older (§13.2).

## 8. Authorization

### 8.1 Flow

A License Server MUST support the OAuth 2.0 Authorization Code flow with PKCE (`S256`) for issuing License Tokens to Subjects. This is the only authorization path OPE defines.

The authorization request MUST include `resource` (RFC 8707) naming the Asset or scope. It MAY include more than one `resource` parameter. The token request MUST repeat `resource` if the authorization request carried more than one.

```
GET /authorize
  ?response_type=code
  &client_id=margin_desktop
  &redirect_uri=margin://oauth/callback
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

**Client review (informative).** Open registration makes a License Server a target for Clients that harvest tokens or misrepresent themselves. A License Server that accepts dynamic registration SHOULD place new Clients in a restricted tier until reviewed: token lifetime no longer than 15 minutes, no refresh token, one `resource` per authorization, and a visible "unreviewed" marker on the consent screen. Review MAY be manual or automated (verified `client_uri` domain, software statement, reputation). The restricted tier is operator policy, not protocol state; the token carries no indication of it.

### 8.3 Identity of the Subject

OPE does not define how the License Server authenticates the Subject. It MAY use its own accounts, OpenID Connect federation to an external provider, passkeys, or magic links. Whatever the method, the License Server MUST produce a `sub` that is stable for that Subject at that issuer across Clients and over time, and MUST NOT use an email address or other directly identifying value as `sub`. See §15 for pairwise `sub` values.

### 8.4 Consent

Before issuing an authorization code, the License Server MUST show the Subject a consent screen stating the Client's name and verified domain, the Asset or scope being authorized (by the Offer's `name`, not the raw URI alone), a link to the Terms, the token lifetime, and how to revoke. The License Server MAY skip consent for a repeat authorization from the same Client for the same or narrower `resource`.

When the `resource` names a scope that spans more than one Publisher (a bundle, §13.6), the consent screen MUST name the bundle and MUST list every Publisher whose Assets it covers.

### 8.5 Token Response

The token endpoint response MUST set `token_type` to `DPoP` when the token is DPoP-bound (RFC 9449 §5) and to `License` otherwise, and MUST include `expires_in`. It SHOULD include `refresh_token`. `expires_in` MUST NOT be `0`; non-expiring tokens are not permitted because they cannot be revoked at a Resource Server that validates locally.

```json
{
  "access_token": "<structured license token>",
  "token_type": "DPoP",
  "expires_in": 3600,
  "refresh_token": "<opaque>",
  "entitlement": { "type": "access", "coverage": "item", "duration": "recurring", "source": "direct" }
}
```

The response MAY include `entitlement`, a copy of the token's `entitlement` claim, so a Client can make advisory checks (§11.3) without parsing the token. It is a convenience for display and proves nothing.

## 9. Structured License Token

### 9.1 Format

An OPE License Token is a JWS-signed JWT conforming to RFC 9068 with the additions below. The JOSE header `typ` MUST be `license+jwt` so that a License Token cannot be mistaken for an ordinary `at+jwt` access token from the same issuer (RFC 8725 §3.11).

### 9.2 Claims

All RFC 9068 §2.2 rules apply.

| Claim | Requirement | Value |
|---|---|---|
| `iss` | REQUIRED | The License Server's `issuer`, which MUST appear in the Asset's Protected Resource metadata `authorization_servers` |
| `sub` | REQUIRED | The Subject (§8.3), a person. |
| `client_id` | REQUIRED | The Client the token was issued through. Kept distinct from `sub`. |
| `aud` | REQUIRED | Origin(s) of the Resource Server(s) the token is valid for |
| `resource` | REQUIRED | The Asset identifier or scope from the request (§5) |
| `terms` | REQUIRED | Terms reference (§6.1) with `sha256` populated |
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
  "terms": { "url": "https://inkwell.example/terms/pro", "sha256": "n4bQgYhMfWWa...", "type": "text/html" },
  "entitlement": {
    "type": "access",
    "coverage": "item",
    "duration": "recurring",
    "source": "direct"
  },
  "iat": 1790000000,
  "exp": 1790003600,
  "jti": "lt_8c2e",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" }
}
```

### 9.3 Keys and Algorithms

The License Server MUST publish its signing keys at `jwks_uri`. Resource Servers MUST resolve keys only from an issuer listed in their own Protected Resource metadata, MUST validate against an explicit algorithm allowlist, and MUST reject `alg: none` (RFC 8725 §3.1, §3.9). Asymmetric algorithms are REQUIRED; `ES256` is RECOMMENDED.

### 9.4 Lifetime

`exp` minus `iat` MUST NOT exceed the server's advertised `max_token_lifetime` and SHOULD NOT exceed 3600 seconds. For group and institutional Entitlements (S4) it SHOULD NOT exceed 1800 seconds. Short lifetimes are the primary mitigation for compromise; revocation is secondary.

### 9.5 Opacity for Clients

Clients MUST treat the token as opaque and MUST NOT parse it to make decisions. Only Resource Servers and the License Server parse it. A Client that wants to know what the Subject holds reads the `entitlement` member of the token response (§8.5), not the token body.

## 10. Entitlements

### 10.1 Types

| Type | Meaning |
|---|---|
| `access` | The Subject may receive the Asset(s) in coverage |
| `limit` | The Subject may receive up to a threshold |
| `status` | The Subject has a standing that changes treatment (ad-free, institutional, group member, patron) |

### 10.2 Fields

| Field | Type | Applies to | Description |
|---|---|---|---|
| `type` | string | all | REQUIRED. `access`, `limit`, or `status` |
| `coverage` | string | access | `item`, `collection`, `all`, or `pre-release`. Which Assets under `resource` the holding applies to. |
| `kind` | string | limit, status | Qualifier: `metered`, `locale-gated`, `patron`, `institutional`, `ad-free`, `group-member`. Extensible; unknown values MUST be ignored by validators that do not recognize them. |
| `duration` | string | access | `perpetual`, `recurring`, `time-limited`, or `rental` |
| `rental_expires_at` | integer | access, `duration: rental` | Unix time the rental ends |
| `transferable` | boolean | access | Whether the Subject may hand the Entitlement to another Subject. Default `false`. |
| `quota` | integer | limit | Items allowed per period |
| `period` | string | limit | ISO 8601 duration of the quota window (`P1D`, `P1W`, `P1M`) |
| `remaining` | integer | limit | Items remaining in the current period at issuance |
| `source` | string | all | `direct`, `broker`, `institution`, `group` |
| `group_id` | string | source `institution` or `group` | Opaque identifier of the paying group |

A validator checks `type`, then only the fields that apply to that type, and MUST reject a token whose `entitlement` is missing `type`.

### 10.3 Named Aliases (Informative)

These names are for documentation and interfaces, not protocol values.

| Alias | type | coverage / kind | duration | source |
|---|---|---|---|---|
| Subscription | access | all | recurring | direct |
| Per-item purchase | access | item | perpetual | direct |
| Rental | access | item | rental | direct |
| Gift | access | item | time-limited | direct, `transferable: true` |
| Trial | access | all | time-limited | direct |
| Bundle | access | collection | perpetual | direct |
| Early access | access | pre-release | time-limited | direct |
| Broker bundle | access | collection | recurring | broker |
| Metered | limit | metered | | direct |
| Institutional | status | institutional | | institution |
| Group / family | status | group-member | | group |
| Patron | status | patron | | direct |
| Ad-free | status | ad-free | | direct |

### 10.4 Entitlement and Coverage

A Resource Server MUST refuse a request for an Asset outside the token's `resource` scope (§5.5), and MUST refuse with `403` and `insufficient_scope` a request for a different Asset under the same scope when `entitlement.coverage` is `item`. The Publisher's current Terms apply to every request regardless of what the token says; the token establishes who the Subject is and what they hold, not what the Publisher permits today.

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
3. Verify that the requested Asset matches `resource` under §5.5 and that `entitlement.coverage` includes it (§10.4).
4. Verify `cnf` when present, per RFC 9449 or RFC 8705.
5. Check revocation: either the token is within a lifetime the Resource Server accepts without introspection (§12.3), or the Resource Server calls `/introspect`.

A Resource Server MAY validate locally. It MUST fall back to `/introspect` (RFC 7662) for any token it cannot validate locally. Local validation never grants more than introspection would.

Steps 1 to 5 establish that the token is genuine and that the Subject holds an Entitlement covering the Asset. They are the minimum decision. A Resource Server MAY apply further policy of its own (its Terms, time windows, locale, per-operation rules, group rules) using the token's claims as inputs to a policy engine or to application code. OPE delivers the principal (`sub`), the Asset (`resource`), and the context (`entitlement`, `terms`); how a Resource Server reasons over them beyond this section is its own business, provided the result is never more permissive than steps 1 to 5 allow.

### 11.3 Advisory Checks

A Client MAY inspect the token response it received to decide what to show the Subject. This is an advisory check. It is not enforcement, because a Client on the Subject's own device can be modified. Publishers MUST NOT rely on advisory checks to protect an Asset. For S1, the Asset (pro export) is protected because Inkwell's server checks the token before running the export, not because Margin shows a "pro" badge.

### 11.4 Responses

| Status | Meaning | Client action |
|---|---|---|
| `401 Unauthorized` | No token, or invalid or expired token | Obtain or refresh a token |
| `402 Payment Required` | No Entitlement covers this Asset | Show the Offer; open `purchase_url` or authorize |
| `403 Forbidden` | Valid token, but coverage or Terms do not permit | Show the Offer; do not retry with the same token |
| `503 Service Unavailable` | Introspection failed and local validation not possible | Retry per `Retry-After` |

`401` and `402` responses MUST include a `WWW-Authenticate` challenge for each scheme the Resource Server accepts (§11.1), each with `error` and `resource_metadata` (§7.1). v0.1's `OPE-*` response headers are withdrawn.

## 12. Token Lifecycle

### 12.1 Refresh

A License Server that issues `refresh_token` MUST rotate it on use and MUST invalidate the previous value (RFC 9700 §4.14). A refresh MUST re-check that the Entitlement is `active` (§17.2). Refresh tokens issued to public Clients MUST be sender-constrained (DPoP) or MUST expire within 30 days of last use.

### 12.2 Revocation

A License Server MUST expose `revocation_endpoint` conforming to RFC 7009. Parameters: `token` (REQUIRED), `token_type_hint` (OPTIONAL, `License` or `refresh_token`). Authentication: the Client's credentials, or the token itself when the caller is the token holder. Response `200` regardless of prior state (RFC 7009 §2.2). After revocation `/introspect` MUST return `active: false` for that `jti` and for any refresh token derived from it.

Publishers revoke through the License Server. A License Server MUST also support the operator actions in §17.3, including revocation by `sub`, `group_id`, `resource`, and `client_id`. How the operator triggers them is out of scope; their effects are not.

### 12.3 Bounding Revocation Delay

Because a locally validated token remains valid until `exp`, a License Server MUST document the interval it can tolerate between revocation and effect. A Resource Server that validates locally MUST NOT accept tokens whose remaining lifetime exceeds the interval it is willing to tolerate, and MUST introspect otherwise. The advertised `max_token_lifetime` is the upper bound of that interval for that issuer.

### 12.4 Introspection

The License Server MUST expose `introspection_endpoint` conforming to RFC 7662, returning `active`, `token_type`, `sub`, `client_id`, `aud`, `resource`, `terms`, `entitlement`, `exp`, and `iat`. Resource Servers authenticate to introspection with their own credentials (§13.4).

## 13. License Servers Operated for Others

A License Server may serve one Publisher or many: a platform hosting creators, a collective selling one subscription across many Publishers, a licensing agency, an institution's library system. This section is what such a server needs beyond a single-Publisher one. v0.1's separate broker subsystem is withdrawn; everything here is ordinary License Server behavior with more than one Publisher attached.

### 13.1 The Trust Relationship Is the Resource Metadata

A License Server is authorized to issue for an Asset if, and only if, its `issuer` appears in `authorization_servers` in the Asset's Protected Resource metadata (§7.1). There is no separate allowlist, registry, or broker agreement in the protocol. A Publisher grants the relationship by listing the server and ends it by removing it.

A License Server MUST NOT issue a token for a resource whose metadata it has not resolved, whose metadata does not list it, or whose metadata it cannot refresh within 24 hours. A Resource Server MUST resolve signing keys only from issuers its own metadata lists (§9.3), so a token from any other issuer fails at step 1 of §11.2 regardless of what the token claims.

### 13.2 Metadata and Terms Ingestion

A License Server MUST obtain each resource's Protected Resource metadata and Terms from the Publisher's published locations, not from a copy supplied out of band. It:

- MUST fetch the metadata for each resource or scope it issues for, and refetch at least every 24 hours (§7.3);
- MUST stop issuing for a resource whose metadata no longer lists it, or cannot be fetched;
- MUST fetch the Terms at `offer.terms.url`, compute `sha256`, and place the reference in every token (§6.1, §9.2);
- SHOULD honor `client_policy` changes on the next issuance;
- SHOULD revoke by `resource` when the Terms digest changes and the Publisher asks for outstanding tokens to be reissued under the new Terms.

### 13.3 Publishers Without Their Own Origin

A Publisher need not control a domain. A creator selling a course, a tool, or a newsletter through a platform is a Publisher whose Assets live under the platform's origin:

```
https://platform.example/creators/alice/courses/woodworking-101
```

For such Publishers:

- the platform publishes path-scoped Protected Resource metadata (RFC 9728 §3) at `/.well-known/oauth-protected-resource/creators/alice/`, one document per creator scope, with that creator's Offer, Terms, and `client_policy`;
- `resources_served` in the License Server's metadata (§7.2) MAY list URL prefixes as well as origins;
- when the platform also operates the Resource Server, `aud` MAY equal `iss`. The audience check in §11.2 still applies.

Two Publishers under one origin MUST have non-overlapping scopes (§5.5). The platform, not the creator, assigns scope prefixes.

### 13.4 Resource Servers Operated by a Different Party

When the Resource Server belongs to the Publisher and the License Server does not, the Resource Server needs a way to call `/introspect` (RFC 7662 requires the endpoint to be protected but does not say how). A License Server:

- MUST offer at least one of: Resource Server registration through `registration_endpoint` (RFC 7591) with a software statement or `client_uri` on the Publisher's origin, or a credential issued out of band and recorded against the resource;
- MUST restrict introspection responses to tokens whose `aud` includes an origin the caller is registered for; a Resource Server MUST NOT be able to introspect tokens for another Publisher's Assets;
- MUST serve `jwks_uri` without authentication, so that a Resource Server with no introspection credential can still validate locally.

A Resource Server with no introspection credential MUST validate locally only and MUST apply the shortest tolerance in §12.3.

### 13.5 Audience and Source

A License Server operated for others:

- MUST set `aud` to the Publisher's Resource Server origin(s) for the Asset, not to itself, except as §13.3 allows;
- MUST set `entitlement.source` to `broker` when the Subject's Entitlement was purchased from the operator (a collective subscription, a platform bundle) and to `direct` when the Subject purchased from the Publisher and the operator only issues;
- MUST NOT store or serve Asset content on the Subject's behalf beyond what is needed to complete a request.

### 13.6 Bundles Across Publishers

An Entitlement MAY cover Assets from more than one Publisher. The License Server:

- issues one token per Publisher `aud`, not one token for the whole bundle. A Client holding a bundle Entitlement obtains tokens per Resource Server as it needs them, each with `resource` narrowed to that Publisher's scope and `entitlement.coverage` set to `collection`;
- MUST NOT place multiple Publishers' Resource Servers in one token's `aud`, so that no Resource Server can replay a token against another;
- MUST satisfy the bundle consent requirement in §8.4.

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
- **Storage.** Clients MUST keep tokens in platform-private storage. Browser-context tokens MUST use `HttpOnly; Secure; SameSite=Lax` cookies (Web profile); `localStorage` and `sessionStorage` MUST NOT be used.
- **Sender constraint.** Public Clients SHOULD use DPoP. A Resource Server that receives a token with `cnf` MUST verify the proof.
- **Lifetime.** §9.4 and §12.3. Non-expiring tokens are prohibited.
- **Audience.** Resource Servers MUST reject tokens whose `aud` does not include their origin (RFC 9700 §2.3).
- **Issuer binding.** A Resource Server MUST accept only issuers its own Protected Resource metadata lists (§7.1, §9.3). Never resolve keys from a URL found inside the token.
- **Redirect URIs.** Exact match, per RFC 9700 §4.1. Custom-scheme redirects for native apps per RFC 8252.
- **Consent.** §8.4. Auto-approve without consent is prohibited on first authorization.
- **Downgrade.** A Resource Server MUST NOT accept a License Token presented as `Bearer`, MUST NOT accept a token carrying `cnf` under the `License` scheme (a bound token presented without its proof), and MUST NOT accept an `at+jwt` token where a `license+jwt` is required.
- **Terms integrity.** The `terms` claim records what the Subject agreed to at issuance. The Publisher's current Terms govern every request (§10.4). A Resource Server that detects a digest mismatch SHOULD continue to serve under the current Terms and MAY ask the License Server to reissue.

## 15. Privacy Considerations

- `sub` MUST be an opaque, issuer-scoped identifier (§8.3). A License Server issuing for more than one Publisher SHOULD make `sub` pairwise per `aud`, so that two Publishers' Resource Servers cannot correlate one Subject across them. It MAY also be pairwise per Client. In either case the License Server holds the mapping and MUST still resolve every variant to one Entitlement. The exception is group administration (§13.7), where an institution's own Resource Servers MAY receive a `sub` stable across that institution's Assets.
- The `terms` claim is a URL and a digest, not the Terms themselves; it reveals nothing beyond the Asset's identity.
- Resource Servers SHOULD log `jti` and `client_id`, not `sub`, for access accounting.
- Advertising status (`kind: ad-free`) is sensitive; Clients MUST NOT expose it to third parties.
- Introspection reveals token status to anyone who can call it; License Servers MUST authenticate introspection callers.

## 16. Conformance Testing

A conforming v0.2 implementation MUST validate against the following, published alongside this specification:

- JSON Schema for the `ope` member of Protected Resource metadata (§7.1), including the Offer and Terms reference.
- JSON Schema for the `ope` member of Authorization Server metadata (§7.2) and for the `entitlement` object (§10).
- A set of signed test vectors: valid tokens, expired tokens, wrong `aud`, wrong `typ`, `alg: none`, issuer not listed in resource metadata, coverage mismatch, revoked `jti`, with expected Resource Server outcomes.
- For the Multi-Publisher License Server target: resource metadata not listing the issuer (MUST refuse to issue), stale metadata older than 24 hours (MUST refetch or refuse), overlapping scopes (longer prefix wins), introspection of another Publisher's token (MUST refuse), bundle token with two Publishers in `aud` (MUST NOT issue), `client_policy` deny (MUST refuse), group removal followed by a token request (MUST refuse), and the operator actions in §17.3 (each MUST be observable through `/introspect`).

Location: `conformance/` in the specification repository. *Status: the schemas and vectors are a v0.2 deliverable and are not yet published. This specification will not advance past Working Draft until they are.* An implementer who cannot run them should treat every MUST above as untested.

## 17. Entitlement Sources and Operator Actions

OPE says what an Entitlement looks like in a token. This section says where one comes from and what an operator must be able to do to it. Payment itself remains out of scope (§0.2); the join between a payment and an Entitlement is in scope, because every License Server has to build it.

### 17.1 The Entitlement Record

A License Server MUST keep, for each Entitlement, a record from which the `entitlement` claim is derived at issuance. The record is internal; its shape is the operator's. It MUST contain enough to answer, for any `sub` and `resource`: does an Entitlement exist, what are its type and fields (§10.2), what state is it in (§17.2), when did it last change, and what external event caused the change (an order, a renewal, a roster entry, a gift code, an administrator). Issuance MUST read the current record, never a copy cached from an earlier request.

### 17.2 Lifecycle States

| State | Meaning | Issuance |
|---|---|---|
| `active` | The Subject holds it | Permitted |
| `suspended` | Temporarily withheld (payment failed, dispute open, administrator hold) | Refused with `402` and `error="entitlement_suspended"` |
| `ended` | Over (cancelled, expired, refunded, member left group) | Refused with `402` |
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
| Revoke by `resource` | All tokens for an Asset or scope die (Terms change, Asset withdrawn) |
| Revoke by `client_id` | All tokens issued through a Client die (compromised or abusive Client) |
| Suspend and resume an Entitlement | §17.2; suspend revokes, resume does not reissue |
| Rotate signing keys | New `kid` published to `jwks_uri` before use; old key remains published until the longest outstanding `exp` has passed |
| Refuse issuance for a Publisher | Stop issuing for a scope without waiting for metadata to change |

Each action MUST take effect for new token requests immediately and for outstanding tokens within `max_token_lifetime`.

### 17.4 Records

A License Server SHOULD keep an append-only record of issuances (`jti`, `sub`, `client_id`, `resource`, `iat`, `exp`, `terms.sha256`, Entitlement state at issuance) and of operator actions, sufficient to answer "who was entitled to what, when, under which Terms, and why" for the Publishers it serves. Retention and access are the operator's policy. Records are not part of the protocol and MUST NOT be exposed through protocol endpoints.

---

# Part II: Profiles

Profiles specify how the core applies to a surface. Each is short by design and normative only where it says so. A profile MUST NOT weaken a core requirement.

## A. Feeds Profile

Applies to RSS 2.0, Atom (RFC 4287), and JSON Feed 1.1.

**OPE element.** A gated item carries one `ope:offer` element in namespace `https://feedspec.org/ope/ns/1.0` (unchanged from v0.1). It names the Asset and repeats the Offer so a Client can present the item without a round trip; the Protected Resource metadata remains authoritative.

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
| `metadata` attribute | OPTIONAL | URL of the Asset's Protected Resource metadata (§7.1). Clients MUST use it when present. |
| `ope:name` | REQUIRED | Offer name |
| `ope:payment` | REQUIRED | `type` REQUIRED; `amount`, `currency`, `period` OPTIONAL (§6.2) |
| `ope:purchase-url` | REQUIRED unless `type` is `free` or `institutional` | Where to buy |
| `ope:entitlement-types` | REQUIRED | Space-separated subset of `access limit status` |
| `ope:terms` | REQUIRED | Terms URL (§6.1) |
| `ope:preview-note` | OPTIONAL | One line for unentitled display |

JSON Feed form: `_ope: { "resource": "...", "metadata": "...", "offer": { ...Offer object as in §6.2... } }`. The underscore prefix is what JSON Feed reserves for extensions; v0.1's `extensions.ope` was not conformant and is withdrawn.

A Publisher that also publishes RSL MAY include its `rsl:` elements alongside; OPE Clients ignore them, and the two do not conflict.

**Gated media.** Publishers SHOULD use `podcast:alternateEnclosure` (Podcasting 2.0) to point at the full media, with the standard `<enclosure>` carrying a preview, so non-OPE players degrade gracefully. The full media URL is the Asset identifier. Publishers MAY return a signed, time-limited URL from the Resource Server instead of serving the canonical URL directly; the signed URL's expiry SHOULD match or exceed the token's.

**Removed from v0.1.** The `content_metadata` block (word count, read time, duration, series title, episode and season numbers, bitrate, item count, preview image). Word count and read time were presentation hints; series and episode fields duplicate Podcasting 2.0 and iTunes namespaces; price is now in the Offer; preview images belong in the item's own `<image>` or `itunes:image`.

**Batch retrieval.** Withdrawn from the core; a Resource Server MAY offer a batch endpoint and, if it does, MUST return partial results with per-item `status`. Documented in `profiles/feeds/batch.md`.

## B. Web Profile

Applies when the Resource Server is a website and the Client is a browser.

**Signaling.** A page that gates content returns `402` (or `200` with a paywall) and MUST include the `WWW-Authenticate` challenge(s) in §11.4. It SHOULD include `<link rel="license" href="<terms url>">` in `<head>` and SHOULD mark paywalled sections with Schema.org `isAccessibleForFree: false` and `hasPart` / `cssSelector` for search engines. v0.1's `OPE-Content-Id`, `OPE-Access-Level`, `OPE-Unlock-URL` headers and `rel="ope-discovery"` are withdrawn.

**Cookie transport.** After authorization, the site's unlock endpoint sets the License Token as a cookie: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<= token lifetime>`. Cookie name is site-defined; v0.1's default `ope_grant` is withdrawn as a protocol constant. Sites check, in order: their own session, `Authorization: License`, then the cookie. The same validation logic (§11.2) applies to all three.

**Unlock flow.** Client opens `purchase_url` from the Offer, or the page's own unlock link. Site checks for an existing session or cookie, otherwise runs Authorization Code + PKCE against a listed License Server (which MAY be the site itself), sets the cookie, redirects to the Asset.

**Cross-Publisher flow.** Identical to the unlock flow with a third-party License Server (§13). The site redirects to that server's `authorization_endpoint` with `resource` set to the Asset and its own registered `redirect_uri`; the server authenticates the Subject, checks the Subject's holding covers this Publisher, issues a token with `aud` set to the Publisher, and redirects back. The Publisher validates per §11.2 and sets the cookie.

**CORS.** Both metadata documents and JWKS: `Access-Control-Allow-Origin: *`. Token and Asset endpoints: credentialed CORS restricted to registered Client origins.

## C. API and Feature Profile

Applies when the Asset is an API, a feature of a service, or an allotment (S1).

- The Asset identifier names the feature or API, not the tier (§5.7).
- The feature's own server is the Resource Server. It MUST publish Protected Resource metadata for the feature and MUST perform the enforcing check (§11.2) on every call that exercises the feature. A Client MAY perform an advisory check to shape its interface (§11.3).
- Metered features use `type: limit` with `quota`, `period`, and `remaining`. The Resource Server is the source of truth for the count; `remaining` in the token is a snapshot at issuance. Resource Servers SHOULD return the current count in a response header `Entitlement-Remaining` (no `X-` prefix, per RFC 6648) and MUST return `403` with `error="quota_exceeded"` when spent.
- Rich Authorization Requests (RFC 9396) with `type: "ope_entitlement"` MAY be used to request a specific Entitlement shape at authorization time.

## D. Agents Profile (Sketch)

Applies when a Client acts for a Subject under delegated, narrowed rights (S3). *This profile is a sketch in v0.2 and is not yet normative.*

- Delegation uses OAuth Token Exchange (RFC 8693). The Subject's Client presents the Subject's License Token as `subject_token`; the agent's `client_id` is the actor; the License Server issues a new License Token with `act: { "sub": "<agent client_id>" }` and an Entitlement no broader than the original.
- Narrowing is by `coverage`, by `type` (an `access` may be exchanged for a `limit`), and by an OPTIONAL `entitlement.operations` array (`read`, `download`) whose grammar is open in v0.2.
- Machines acting for themselves do not use this profile.
- Open questions: whether `act` chains (agent of an agent) are permitted; audit expectations; how a Subject revokes delegated tokens without revoking their own.

## E. ATProto Profile (Deferred)

v0.1 §15 described integration with what ATProto then called permission spaces, and defined three lexicons under `org.feedspec.ope.*`. That work is now called **atproto spaces**. It entered public alpha on 2026-08-20 with a reference PDS, community PDS implementations, and alpha SDKs. Bluesky has said the alpha will see breaking changes, should not be used in production, and is targeted for launch later in 2026. As of this revision, credential format, repo serialization, commit signatures, DID document semantics, and the space URI syntax are all still changing.

v0.2 defers the profile until atproto spaces reaches a stable release. The v0.1 text is preserved in `profiles/atproto/v0.1-draft.md` for reference and is not normative; it predates the current design and should not be implemented.

Notes for the future profile (informative):

- Atproto spaces names subscription-only publishing as an intended use, so the overlap with OPE is direct.
- The likely mapping is: space authority to License Server, space membership to Entitlement, space credential to License Token. Whether OPE should wrap space credentials, issue alongside them, or simply describe how an OPE Resource Server admits space members is the main design question.
- Space credentials moved from DPoP to HTTP Message Signatures in the October 2026 alpha. OPE uses DPoP (§8.2, §11.1). The profile will need to bridge the two or explain why it does not need to.
- The `org.feedspec.ope.*` namespace was self-assigned and will be reconsidered when the profile is written.

Two v0.2 core decisions were made with ATProto in mind: Asset identifiers admit non-`https` URIs (§5.2), and `sub` is issuer-scoped rather than a DID, so a future profile can map either way.

---

# Part III: Roadmap, Examples, and Appendices

## Roadmap

| Item | Owner | Detail |
|---|---|---|
| **Conformance kit** | Editor | JSON Schemas and signed test vectors (§16). Gate for advancing past Working Draft. |
| **Second implementer** | Editor | One independent Client and one independent License Server (D8). Gate for advancing past Working Draft. |
| **Alignment proposal to RSL** | Editor | OPE stands alone (§0.1 goal 5). Separately, four issues have been filed with RSL's Technical Steering Committee that would improve RSL for all users: public clients and sender-constrained tokens, a structured token profile on RFC 9068, an RFC 7009 revocation endpoint, and a JSON serialization of terms. Once OPE has independent implementations, the editor intends to propose to the TSC how an RSL License Server could add the OPE profile for human subjects, and how a Publisher's RSL document could serve as OPE Terms. Whether to pursue that is RSL's decision; OPE's roadmap does not depend on the answer. |

## Worked Example: S1, Pro Feature in a Third-Party App

A member buys the pro tier of *Inkwell*, a writing tool, and wants "pro export" to work inside *Margin*, a separate editor. A third party, *Lantern*, a subscription collective, operates the License Server for Inkwell.

**1. Metadata.** Inkwell publishes Protected Resource metadata at `https://inkwell.example/.well-known/oauth-protected-resource/features/pro-export` listing `authorization_servers: ["https://license.lantern.example"]` and an `ope.offer` for "Inkwell Pro" at $8.00/month with `terms.url` pointing at Inkwell's own terms page.

**2. Discovery.** Margin requests `https://inkwell.example/features/pro-export`, receives `402` with `WWW-Authenticate: DPoP error="no_entitlement", resource_metadata="https://inkwell.example/.well-known/oauth-protected-resource/features/pro-export"`, fetches it, shows the Offer, and fetches `https://license.lantern.example/.well-known/oauth-authorization-server`.

**3. Registration.** Margin is a public Client. It registers once via `registration_endpoint` and receives `client_id: margin_desktop` and no secret.

**4. Authorization.** Margin opens the system browser to `authorization_endpoint` with PKCE and `resource=https://inkwell.example/features/pro-export`. The member signs in (the License Server federates to an OIDC provider), sees a consent screen naming Margin, "Inkwell Pro", and a link to Inkwell's terms, and allows.

**5. Token.** Margin exchanges the code, with a DPoP proof, and receives a `license+jwt` with `sub: s_3f9a1c`, `client_id: margin_desktop`, `aud: ["https://inkwell.example"]`, `resource` as above, `terms` with the digest of Inkwell's terms page, `entitlement: { type: access, coverage: item, duration: recurring, source: direct }`, and `exp` one hour out.

**6. Use.** Margin calls `POST https://inkwell.example/api/export` with `Authorization: DPoP <token>` and a `DPoP` proof header. Inkwell's server confirms the issuer is in its own metadata, verifies signature against the License Server's JWKS, `typ`, `aud`, `exp`, `resource`, coverage, and `cnf`, sees 55 minutes remaining (under its 60-minute local-validation tolerance), and runs the export.

**7. A second app.** The member later installs a different editor. It repeats steps 2 to 5 with its own `client_id`. The License Server issues a second token for the same `sub` and `resource`. There is still one subscription.

**8. Cancellation.** The member cancels. The Entitlement record moves to `ended`; the License Server revokes by `sub` and `resource`; `/introspect` returns `active: false`; outstanding tokens die within the hour. If Margin had instead toggled "pro" locally without calling Inkwell's API, nothing in OPE would have stopped it; that is why §11.3 exists.

## Appendix A: Migration Notes (Informative)

| Platform pattern | v0.2 path |
|---|---|
| Private per-subscriber feed URLs (Substack, Supercast, Patreon tiers) | Publish one feed with `ope:offer` per gated item and Protected Resource metadata on the media origin; run or contract a License Server; replace per-subscriber URLs with Authorization Code + PKCE |
| HTTP Basic on feed URLs | Same, plus `podcast:alternateEnclosure` for full media |
| Platform-locked premium podcasts (Apple, Spotify) | Publish an OPE-enabled RSS feed alongside; the platform's own entitlement continues in parallel |
| Course platforms | One scope per course with coverage `collection`; lessons as Assets under the course prefix |
| Existing site auth (Clerk, Auth0, custom) | Keep it. The License Server federates to it, or the site issues License Tokens after its own login (Web profile) |
| Publishers already using RSL | Point `offer.terms.url` at the RSL document with `type: application/rsl+xml`; add OPE's `ope` member to Protected Resource metadata; keep RSL's OLP for crawlers |

## Appendix B: Implementer Guide (Informative)

**License Server (minimum):** RFC 8414 metadata with `ope` member; Authorization Code + PKCE; `/token` returning `license+jwt`; `/revoke`; `/introspect`; JWKS; Protected Resource metadata ingestion (§13.2); an Entitlement record (§17). Reuse an existing OAuth server and add the token claims and the two OPE-specific behaviors (`resource` binding, `terms` and `entitlement` claims). *Effort estimates from v0.1 are withdrawn until the conformance kit exists to measure against.*

**Resource Server (minimum):** Protected Resource metadata with `ope.offer`; §11.2 in a middleware; JWKS caching; a tolerance for local validation; `/introspect` fallback; `WWW-Authenticate` challenges with `resource_metadata` on 401/402.

**Client (minimum):** RFC 9728 fetch from `WWW-Authenticate` or from a feed's `ope:offer`; RFC 8414 fetch; Authorization Code + PKCE with `resource`; DPoP; secure per-issuer token storage; refresh before `exp`; `Authorization: DPoP` (or `License` for unbound tokens).

**Reference implementations.** Eleventy demo (<https://github.com/shellen/ope-eleventy-demo>) targets v0.1 and will be updated. The reference gateway remains planned. Neither is a substitute for the conformance kit in §16.

## Appendix C: Changes from v0.1

Structural. v0.1 was 24 sections in one document. v0.2 is a 17-section core, five profiles, and appendices.

**Revision 4 (2026-10-05) within v0.2.** Correctness pass. DPoP-bound tokens now use RFC 9449's `DPoP` scheme and `token_type`; revision 3's use of `License` for them conflicted with RFC 9449 (§8.5, §11.1, §14). Clients follow a `resource_metadata` URL when given and request the metadata's `resource` when metadata is published per scope (§5.6, §7.1); feeds may carry the metadata URL. Scopes may nest within a Publisher, longest prefix wins (§5.5; revision 3 forbade overlap and then gave an overlap rule). Durations in Offers and limit Entitlements are ISO 8601 (`P1M`, `PT72H`), removing the last numbers encoded in strings. Token response MAY carry `entitlement` for advisory display (§8.5, §9.5). `X-Entitlement-Remaining` renamed `Entitlement-Remaining` (RFC 6648). D13, D14 added.

**Revision 3 (2026-10-05) within v0.2.** OPE no longer depends on any specification outside OAuth and its RFCs. Replaced RSL-based discovery and trust with RFC 9728 Protected Resource Metadata (§7.1, §13.1); replaced the borrowed terms vocabulary with a Terms reference by URL and digest (§6.1) and an Offer object (§6.2); renamed the `license` claim to `terms`; moved `client_policy` into Protected Resource metadata (closes D10); renamed `ope.publishers` to `resources_served`; reframed §1.1 and the Roadmap as alignment with RSL rather than convergence into it; §2.2 keeps RSL's role names and says so. Token format otherwise unchanged; Clients from revision 2 need only follow `resource_metadata` instead of `Link rel="license"`.

**Revision 2 (2026-10-05) within v0.2.** Added for operators of License Servers serving more than one Publisher: §2.4 fourth conformance target; §8.2 Client review tier; §8.4 bundle consent; §11.2 minimum decision statement; §13 rewritten in full; §15 pairwise `sub` per audience; §16 multi-Publisher test vectors; §17 Entitlement sources and operator actions.

| v0.1 | v0.2 | Reason |
|---|---|---|
| No goals or acceptance stories | §0 added | Scope gate |
| §3.2 "RSL is adjacent" | §1.1: vocabulary aligned, independence stated, alignment proposal deferred to Roadmap | Accuracy without dependency |
| Terminology: Resource, Feed, Manifest, Grant, Grant Token, Client/reader, Publisher, Entitlement Broker, Content Metadata | Asset, Publisher, Terms, Offer, License Server, Resource Server, Client, Subject, License Token, Entitlement, Coverage | One name per thing; role names shared with RSL |
| `Resource` included "capability" | Withdrawn; "feature" | Collision |
| Discovery at `/.well-known/ope` (~10 nested objects) | RFC 9728 metadata with one `ope` member (Offer, policy) and RFC 8414 metadata with one `ope` member (5 fields) | Reuse; unregistered well-known suffix withdrawn |
| Inline `auth` fallback | Removed | RFC 8414 is REQUIRED |
| Separate entitlement grant, refresh, revocation endpoints | OAuth `token_endpoint`, `refresh_token`, RFC 7009 `revocation_endpoint`, RFC 7662 `introspection_endpoint` | Reuse |
| Simple and Portable token modes | One mode: structured `license+jwt` | Simple mode could not be verified by third parties and did not meet the portability definition |
| JWT, PASETO, macaroons | JWT (RFC 9068 profile) only | Surface area |
| `grant` claim with `type`, `scope`, `kind`, `duration`, `transferable`, `quota`, `period`, `source` | `entitlement` claim with `type`, `coverage`, `kind`, `duration`, `rental_expires_at`, `transferable`, `quota`, `period`, `remaining`, `source`, `group_id` | Rename `scope` to `coverage`; `rental:Nh` string replaced by a timestamp; `signal` renamed `status` |
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
| D1 | Text license: CC BY 4.0 proposed. Confirm or choose CC0 or Apache 2.0 for everything. | Editor | Before publishing v0.2 |
| D2 | Offer `payment.type` values. Six are defined, aligned with RSL where RSL has the word. Decide whether `rental` and `institutional`, which RSL lacks, should be proposed to RSL or remain OPE-only. | Editor | With the alignment proposal |
| D3 | Terms `sha256` on content that varies by viewer (localized pages, A/B tests). Decide whether the digest should be of a canonical representation the Publisher nominates. | Editor | v0.3 |
| D4 | Scope matching for non-`https` identifiers (§5.5). Depends in part on atproto spaces, which is still deciding whether to change its URI syntax to conform to IETF URI rules. Revisit once that settles. | Editor, with ATProto community | Profile E revival |
| D5 | Whether §5.2(3) should make query components MUST NOT rather than SHOULD NOT. | Editor | v0.3 |
| D6 | Agents profile: `act` chaining, `operations` grammar, delegated revocation (Profile D). | Editor | v0.3 |
| D7 | Whether `remaining` belongs in the token at all, given the Resource Server is the source of truth (Profile C). | Editor | v0.3 |
| D8 | Second implementer. No party other than the editor's own projects has implemented OPE. The specification SHOULD NOT advance past Working Draft without one independent Client and one independent License Server. | Editor | Ongoing |
| D9 | Namespace `https://feedspec.org/ope/ns/1.0` is retained for the feed element despite the spec being 0.2. Decide whether to version the namespace at 1.0 or move to a permanent unversioned namespace. | Editor | v0.3 |
| D10 | *Closed in revision 3.* Publisher-side Client allow/deny lists now live in `ope.client_policy` in Protected Resource metadata (§7.1). | | |
| D11 | Resource Server introspection credentials (§13.4). Two mechanisms are allowed; decide whether to require DCR with a software statement so that any Publisher's Resource Server can onboard without an out-of-band step. | Editor | v0.3 |
| D12 | The `License` HTTP authentication scheme is defined by RSL and is not IANA-registered. Decide whether OPE should register it jointly with RSL, register its own, or continue using it unregistered. | Editor | With the alignment proposal |
| D13 | With DPoP-bound tokens on the `DPoP` scheme, `License` applies only to unbound tokens, which §8.2 discourages for public Clients. Decide whether to keep the `License` scheme at all, or require DPoP and drop it. | Editor | v0.3 |
| D14 | RFC 9728 defines `resource_metadata` as a `WWW-Authenticate` parameter with Bearer-scheme examples. Confirm it is usable with `DPoP` and `License` challenges as written, or note the deviation. | Editor | Before publishing v0.2 |

## Appendix E: References

**Normative.** RFC 2119, RFC 8174 (requirement language). RFC 3986 (URI). RFC 6749 (OAuth 2.0). RFC 7009 (Token Revocation). RFC 7517 (JWK). RFC 7519 (JWT). RFC 7591 (Dynamic Client Registration). RFC 7636 (PKCE). RFC 7662 (Token Introspection). RFC 8252 (OAuth for Native Apps). RFC 8414 (Authorization Server Metadata). RFC 8707 (Resource Indicators). RFC 8725 (JWT BCP). RFC 9068 (JWT Profile for Access Tokens). RFC 9110 (HTTP Semantics). RFC 9449 (DPoP). RFC 9700 (OAuth 2.0 Security BCP). RFC 9728 (OAuth 2.0 Protected Resource Metadata). ISO 4217 (currency codes). ISO 8601 (durations).

**Informative.** Really Simple Licensing 1.0 (rslstandard.org/rsl, 2025-12-10). RFC 4287 (Atom). RFC 6648 (Deprecating the X- prefix). RFC 8615 (Well-Known URIs). RFC 8693 (Token Exchange). RFC 8705 (mTLS). RFC 9126 (PAR). RFC 9396 (RAR). OpenID Connect Core 1.0. JSON Feed 1.1. Podcasting 2.0 namespace (podcastindex.org). Schema.org CreativeWork paywall markup. AT Protocol specifications. Atproto spaces proposal (github.com/bluesky-social/proposals, 0016) and alpha announcement (atproto.com/blog/atproto-spaces-alpha, 2026-08-20). x402. Web Monetization (WICG). ODRL. Creative Commons.

## Acknowledgments

Thanks to Max Engel for feedback on OAuth alignment, token architecture, and revocation enforcement. Thanks to the Really Simple Licensing Technical Steering Committee, whose vocabulary this specification shares. Thanks to the ATProto team, particularly Daniel Holmgren, for the design work, now atproto spaces, that informed v0.1 §15 and Profile E.

## Editor

Jason Shellen <https://shellen.com>. ATProto / Bluesky: @shellen.com.

feedspec.org is a project by Jason Shellen. Contribute at <https://github.com/shellen/open-portable-entitlement>.
