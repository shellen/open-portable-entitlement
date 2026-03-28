# Open Portable Entitlement (OPE)

**Draft Specification v0.1**

Status: Working Draft
Editor: Jason Shellen
https://shellen.com • @shellen.com (ATProto / Bluesky)
Date: 2026

*A portable entitlement layer for resources discovered through feeds and decentralized publishing. OPE standardizes entitlement verification—not payment systems—enabling portable subscriptions and content access across platforms, readers, and protocols.*

**This draft includes:** RFC 8414 OAuth Discovery alignment, Simple and Portable token modes, PAR/RAR/DPoP support, Web-Based Entitlement (HTTP 402, cookie transport, browser unlock flows), Consent Screen requirements, Dynamic Client Registration (RFC 7591), PKCE requirement, Cross-Publisher Browser Flow via Entitlement Brokers, Security Considerations, Implementer Guide with Reference Gateway, Entitlement Aggregation, Content Metadata for unentitled states, Batch Content Retrieval, Multi-publisher Session Management, ATProto Permission Spaces integration path, Payment Protocol landscape positioning, and Complete Worked Example.

---

## 1. Abstract

Open Portable Entitlement (OPE) proposes a portable method for readers to access protected resources referenced in feeds. The specification enables publishers to distribute preview content through RSS, Atom, JSON Feed, or AT Protocol; authenticate readers; issue entitlement grants; and allow authorized clients to retrieve full content—whether those clients are API consumers, feed readers, browser extensions, or web browsers.

OPE standardizes entitlement verification, not payment systems. This enables portable subscriptions and resource access across platforms and readers while preserving compatibility with existing feed ecosystems.

While the primary use case is content (articles, media, newsletters), the entitlement architecture is deliberately resource-agnostic. The grant token mechanism does not constrain what is being entitled—content, API access, capabilities, or any other gated resource. OPE grant tokens are transport-agnostic: they can be presented via HTTP `Authorization` headers (API clients) or `HttpOnly` cookies (browsers), using the same token format and verification logic in both cases.

## 2. Status of This Document

This document is a working draft intended for discussion among feed ecosystem maintainers, publishing platforms, reader developers, and decentralized protocol communities. The specification may change substantially prior to wider review.

## 3. Design Philosophy

OPE does not attempt to replace existing feed formats or payment protocols. Instead, it adds a portable entitlement layer that occupies the space between content distribution and payment processing. The architecture deliberately separates four concerns:

- **Content:** the articles, media, and resources themselves
- **Distribution:** feed formats (RSS, Atom, JSON Feed, ATProto records) that catalog and deliver previews
- **Entitlement:** verification that a reader has the right to access content
- **Payments:** the mechanisms by which money changes hands (explicitly out of scope)

This separation allows publishers and readers to experiment with new monetization models without locking content distribution to a specific platform.

**A note on naming:** OPE is not a feed format. There is no such thing as an "OPE feed." There are RSS feeds, Atom feeds, JSON Feeds, and ATProto records that are OPE-enabled—meaning they include OPE extension metadata alongside their existing format. OPE is a portable entitlement layer that works with any feed format, not a replacement for any of them.

### 3.1 Relationship to Payment Protocols

OPE is complementary to emerging payment protocols such as x402 (Coinbase), Stripe's Machine Payments Protocol (MPP), and the Agentic Commerce Protocol (ACP). These protocols handle the movement of money. OPE handles the proof of access that results from payment—or from any other entitlement origin (gift, institutional access, patronage, broker bundle).

x402 moves money. ACP handles checkout. OPE proves you're allowed in.

A publisher could accept payment via x402 micropayment and issue an OPE grant token as the result. The grant token doesn't care how money changed hands—only that the entitlement was legitimately issued.

## 4. Terminology

| Term | Definition |
| --- | --- |
| Resource | Any gated item: article, media, API endpoint, capability |
| Feed | Catalog of content items in RSS, Atom, JSON Feed, or ATProto format |
| Manifest | Publisher metadata describing entitlement and content endpoints |
| Grant | Authorization allowing access to a resource |
| Grant Token | Signed token proving access rights |
| Reader | Client application retrieving and presenting feeds |
| Publisher | Content provider issuing entitlements |
| Entitlement Broker | Optional intermediary aggregating entitlements across publishers |
| Content Metadata | Structured preview information shown to unentitled readers |

## 5. Architecture

The OPE system separates discovery from authorization. The complete flow is:

```
Feed (discovery) → OPE Discovery (capabilities) → Authentication (identity)
  → Grant Token (authorization) → Content Retrieval (access)
```

Readers MAY cache grant tokens for the duration specified by the token's TTL. Readers MUST refresh tokens before expiry using the refresh endpoint.

## 6. Discovery

Publishers SHOULD expose a discovery endpoint:

```
GET /.well-known/ope
```

```json
{
  "version": "0.1",
  "oauth_server": "https://example.com/.well-known/oauth-authorization-server",
  "entitlement": {
    "grant_url": "https://example.com/api/entitlement/grant",
    "refresh_url": "https://example.com/api/entitlement/refresh",
    "revocation_url": "https://example.com/api/entitlement/revoke",
    "token_format": "jwt",
    "token_mode": "portable",
    "default_ttl_seconds": 3600,
    "max_ttl_seconds": 86400
  },
  "content": {
    "endpoint_template": "https://example.com/api/content/{id}",
    "batch_endpoint": "https://example.com/api/content/batch",
    "formats_available": ["html", "markdown", "text"]
  },
  "metadata": {
    "subscribe_url": "https://example.com/subscribe",
    "pricing_url": "https://example.com/api/pricing",
    "plans": [
      { "id": "monthly", "name": "Monthly", "currency": "USD", "amount": 500 },
      { "id": "annual", "name": "Annual", "currency": "USD", "amount": 5000 }
    ]
  },
  "grants_supported": [
    "subscription", "gift", "per_item", "institutional",
    "metered", "locale_free", "patronage", "broker"
  ],
  "broker_support": true,
  "client_registration_endpoint": "https://example.com/api/ope/register",
  "web": {
    "unlock_endpoint": "https://example.com/api/ope/unlock",
    "cookie_domain": "example.com",
    "cookie_name": "ope_grant",
    "cookie_path": "/"
  }
}
```

### 6.1 OAuth Discovery Alignment (RFC 8414)

OPE builds on top of existing OAuth 2.0 Authorization Server Metadata (RFC 8414) rather than duplicating it. The `oauth_server` field points to the publisher's standard OAuth discovery endpoint, which already publishes `authorization_endpoint`, `token_endpoint`, `scopes_supported`, `jwks_uri`, and related OAuth configuration.

If a publisher does not expose RFC 8414 discovery, the OPE manifest MAY include an inline `auth` block as a fallback:

```json
{
  "auth": {
    "type": "oauth2",
    "authorize_url": "https://example.com/oauth/authorize",
    "token_url": "https://example.com/oauth/token",
    "scopes_supported": ["content:read", "content:batch"]
  }
}
```

Publishers that support RFC 8414 SHOULD NOT duplicate auth fields in the OPE manifest.

### 6.2 Discovery Field Reference

**entitlement.token_mode**: Either `"simple"` or `"portable"`. See Section 8 for details.

**entitlement.revocation_url**: Endpoint for revoking grant tokens. Critical for institutional access where employees leave organizations.

**content.batch_endpoint**: Enables readers to retrieve multiple entitled articles in a single request.

**metadata**: Structured information about subscription offerings, allowing readers to present subscribe prompts without opening a browser.

**broker_support** (boolean, optional): Indicates whether this publisher accepts entitlement verification from recognized Entitlement Brokers, enabling multi-publisher subscription bundles.

**client_registration_endpoint** (string, optional): URL for Dynamic Client Registration (RFC 7591). When present, OPE consumers can register programmatically rather than requiring out-of-band registration with the publisher. See Section 7.6.

**web** (object, optional): Configuration for browser-based entitlement. When present, indicates the publisher supports cookie-based grant token transport for web clients. See Section 11.

**web.unlock_endpoint** (string): URL that accepts a grant token and sets a browser cookie, enabling feed-to-browser unlock flows.

**web.cookie_domain** (string): Domain for the `ope_grant` cookie.

**web.cookie_name** (string): Name of the cookie. Defaults to `ope_grant` if omitted.

**web.cookie_path** (string): Path scope for the cookie. Defaults to `/`.

## 7. Authentication

OPE uses OAuth 2.0 for authentication. Publishers MUST support the Authorization Code flow with PKCE (RFC 7636). Publishers SHOULD support the following OAuth extensions:

### 7.1 Pushed Authorization Requests (PAR, RFC 9126)

Publishers SHOULD support PAR for server-side auth initiation. PAR moves authorization parameters from the front channel (browser URL) to the back channel (server-to-server POST), reducing exposure of authorization details and enabling richer authorization requests.

### 7.2 Rich Authorization Requests (RAR, RFC 9396)

Publishers SHOULD support RAR for fine-grained permission definitions. RAR enables structured authorization details that map naturally to OPE grant types:

```json
{
  "authorization_details": [
    {
      "type": "ope_entitlement",
      "publisher": "did:web:shellen.com",
      "grant_type": "subscription",
      "scopes": ["content:read", "content:batch"]
    }
  ]
}
```

### 7.3 Demonstrating Proof of Possession (DPoP, RFC 9449)

Publishers SHOULD support DPoP for binding tokens to client keys. DPoP prevents token theft from being useful across clients by requiring the presenting client to prove possession of the private key bound to the token. This directly strengthens the token binding recommendation in Section 12.1.

### 7.4 Scope Requirements

The following OAuth scopes are defined:

- `content:read` — REQUIRED. Read access to entitled content.
- `content:batch` — RECOMMENDED. Batch retrieval of multiple entitled items.

### 7.5 Consent Screen Requirements

Publishers MUST display a consent screen before issuing authorization codes. Auto-redirecting after authentication without user consent is an OAuth anti-pattern that undermines user trust and violates the intent of the authorization code flow.

The consent screen MUST display:

- **Client identity:** The application name and verified domain of the requesting client.
- **Requested scopes:** Human-readable descriptions of the access being granted (e.g., "Read your subscribed content" for `content:read`).
- **Grant duration:** How long the authorization will remain active.
- **Action buttons:** Clearly labeled "Allow" and "Deny" controls.
- **Revocation link:** A link or instructions for revoking access later.

Publishers MAY skip the consent screen for repeat authorizations from the same client if the user has previously consented and the requested scopes have not expanded. Publishers MUST re-prompt consent if new scopes are requested.

### 7.6 Dynamic Client Registration (RFC 7591)

To support an open ecosystem where any OPE-compatible reader can obtain entitlements, publishers SHOULD support Dynamic Client Registration per RFC 7591. This eliminates the need for out-of-band client registration (e.g., hardcoded client ID allowlists).

```
POST /api/ope/register
Content-Type: application/json
```

```json
{
  "client_name": "FeedReader Pro",
  "redirect_uris": ["https://feedreader.pro/callback"],
  "grant_types": ["authorization_code"],
  "scope": "content:read content:batch",
  "client_uri": "https://feedreader.pro",
  "logo_uri": "https://feedreader.pro/logo.png",
  "contacts": ["admin@feedreader.pro"]
}
```

```
201 Created
```

```json
{
  "client_id": "fr_pro_a1b2c3",
  "client_secret": "secret_xyz",
  "client_id_issued_at": 1710000000,
  "client_secret_expires_at": 0,
  "registration_access_token": "reg_token_abc",
  "registration_client_uri": "https://example.com/api/ope/register/fr_pro_a1b2c3"
}
```

The `client_secret` is issued only for confidential clients (server-side applications). Public clients (SPAs, mobile apps, browser extensions, CLI tools) MUST use PKCE and MUST NOT receive a `client_secret`. Publishers SHOULD assign newly registered clients a limited scope and MAY require manual approval before granting full access.

The registration endpoint URL is published in the discovery document as `client_registration_endpoint`.

## 8. Grant Tokens

Grant tokens prove entitlement. They are issued by publishers (or brokers) and presented by readers when retrieving content.

### 8.1 Token Modes

OPE defines two token modes to balance simplicity and portability:

**Simple mode:** The OAuth access token itself carries OPE claims as custom fields. This reduces the grant flow from two steps (OAuth token → OPE grant) to one. Trade-off: simple mode tokens are bound to a single authorization server and cannot be independently verified by third parties. Simple mode does not support broker scenarios.

**Portable mode:** A separate OPE grant token is issued via the entitlement grant endpoint after OAuth authentication. Portable tokens are independently verifiable by any party that trusts the issuer's signing key. Portable mode is REQUIRED for broker support. Macaroons are RECOMMENDED for broker tokens due to native capability attenuation.

Publishers declare their supported mode in the discovery document via `token_mode`.

### 8.2 Required Claims

| Claim | Type | Description |
| --- | --- | --- |
| iss | string | Publisher domain or DID |
| sub | string | User identifier |
| scope | string[] | Access scopes granted |
| grant_type | string | Origin of the grant (subscription, gift, etc.) |
| exp | integer | Expiry timestamp (Unix epoch) |
| iat | integer | Issued-at timestamp |
| jti | string | Unique token identifier (for revocation) |

### 8.3 Optional Claims

| Claim | Type | Description |
| --- | --- | --- |
| content_ids | string[] | Specific content items (for per_item grants) |
| meter_remaining | integer | Reading entitlements remaining in metered access (decrements per content retrieval, not per content creation) |
| institutional_domain | string | Domain for institutional verification |
| broker_id | string | Broker that issued the grant (for broker grants) |
| refresh_token | string | Token for refreshing the grant |
| cnf | object | DPoP confirmation claim (RFC 9449) |

### 8.4 Example Token (Portable Mode)

```json
{
  "iss": "shellen.com",
  "sub": "user123",
  "scope": ["content:read", "content:batch"],
  "grant_type": "subscription",
  "exp": 1710000000,
  "iat": 1709996400,
  "jti": "grant_abc123",
  "cnf": { "jkt": "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" }
}
```

### 8.5 Token Formats

| Format | Notes | Recommended For |
| --- | --- | --- |
| JWT (RFC 7519) | Widely supported, easy to verify | Most implementations |
| PASETO | Modern cryptography, no algorithm confusion | High-security deployments |
| Macaroons | Delegation-friendly, capability restrictions | Broker and institutional grants |

Macaroons are particularly useful for broker scenarios because they allow a broker to attenuate a publisher's grant with additional restrictions (e.g., limiting access to a specific reader client or content category).

## 9. Feed Extensions

Feeds declare entitlement requirements per item. OPE introduces structured content metadata so readers can present meaningful information to unentitled users.

### 9.1 JSON Feed

```json
{
  "id": "post-123",
  "title": "Deep Essay on Protocol Design",
  "content_text": "Preview: The history of feed formats reveals...",
  "extensions": {
    "ope": {
      "required": { "level": "subscriber" },
      "grants_allowed": ["subscription", "gift", "per_item", "broker"],
      "content_id": "post-123",
      "content_metadata": {
        "word_count": 3200,
        "estimated_read_time_minutes": 14,
        "content_type": "essay",
        "preview_image": "https://shellen.com/img/post-123-hero.jpg",
        "unlock_cta": "Subscribe to read the full essay",
        "unlock_url": "https://shellen.com/post-123?ope_unlock=1",
        "per_item_price": { "currency": "USD", "amount": 200 }
      }
    }
  }
}
```

**content_metadata**: Provides structured information for readers to display rich previews of gated content. All fields are optional. The **unlock_cta** field allows publishers to specify a call-to-action string. The **unlock_url** field provides a browser-openable URL that triggers the web-based entitlement flow (see Section 11), bridging feed discovery to browser access. The **per_item_price** field uses the smallest currency unit (e.g., cents for USD).

### 9.2 Atom (RFC 4287)

Namespace:

```
xmlns:ope="https://feedspec.org/ope/ns/1.0"
```

```xml
<entry>
  <id>https://shellen.com/post-123</id>
  <title>Deep Essay on Protocol Design</title>
  <updated>2026-03-03T00:00:00Z</updated>
  <link rel="alternate" href="https://shellen.com/post-123" type="text/html"/>
  <summary>Preview: The history of feed formats reveals...</summary>
  <ope:access level="subscriber">
    <ope:content-id>post-123</ope:content-id>
    <ope:grant-types>
      <ope:type>subscription</ope:type>
      <ope:type>gift</ope:type>
      <ope:type>broker</ope:type>
    </ope:grant-types>
    <ope:metadata>
      <ope:word-count>3200</ope:word-count>
      <ope:unlock-cta>Subscribe to read the full essay</ope:unlock-cta>
      <ope:unlock-url>https://shellen.com/post-123?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</entry>
```

### 9.3 RSS 2.0

```xml
<item>
  <title>Deep Essay on Protocol Design</title>
  <link>https://shellen.com/post-123</link>
  <description>Preview: The history of feed formats reveals...</description>
  <ope:access level="subscriber">
    <ope:content-id>post-123</ope:content-id>
    <ope:metadata>
      <ope:unlock-cta>Subscribe to read the full essay</ope:unlock-cta>
      <ope:unlock-url>https://shellen.com/post-123?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</item>
```

## 10. Content Retrieval

### 10.1 Single Item

```
GET /api/content/post-123
Authorization: Bearer <grant_token>
Accept: text/html
```

```
200 OK
Cache-Control: private, max-age=3600
Content-Type: application/json
```

```json
{
  "id": "post-123",
  "title": "Deep Essay on Protocol Design",
  "content_html": "<p>Full article content...</p>",
  "published": "2026-03-03T00:00:00Z",
  "author": { "name": "Jason Shellen", "url": "https://shellen.com" }
}
```

### 10.2 Batch Retrieval

Readers SHOULD use batch retrieval when syncing multiple gated items. This avoids N+1 request patterns when a user opens their reader after being offline.

```
POST /api/content/batch
Authorization: Bearer <grant_token>
Content-Type: application/json
```

```json
{
  "content_ids": ["post-123", "post-124", "post-125"],
  "format": "html"
}
```

```
200 OK
```

```json
{
  "items": [
    { "id": "post-123", "title": "...", "content_html": "..." },
    { "id": "post-124", "title": "...", "content_html": "..." },
    { "id": "post-125", "status": "not_entitled", "reason": "per_item_required" }
  ]
}
```

The batch endpoint MUST return partial results. Items the user is not entitled to SHOULD include a status field with the reason, rather than being omitted. The maximum batch size is publisher-defined and SHOULD be communicated in the manifest.

### 10.3 Error Responses

| Status | Meaning | Reader Behavior |
| --- | --- | --- |
| 401 Unauthorized | Token missing or invalid | Re-authenticate with publisher |
| 402 Payment Required | Content requires entitlement (web) | Discover unlock flow via OPE headers (see Section 11) |
| 403 Forbidden | Valid token but insufficient entitlement | Show content metadata and subscribe prompt |
| 404 Not Found | Content ID does not exist | Remove from local cache |
| 410 Gone | Content was removed by publisher | Remove from local cache |
| 429 Too Many Requests | Rate limited | Backoff per Retry-After header |

Error responses MUST use the following JSON body format:

```json
{
  "error": "not_entitled",
  "error_description": "Valid token but insufficient entitlement for this content",
  "content_id": "post-123",
  "ope_discovery": "https://example.com/.well-known/ope"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| error | string | REQUIRED | Machine-readable error code: `invalid_token`, `not_entitled`, `not_found`, `gone`, `rate_limited` |
| error_description | string | RECOMMENDED | Human-readable explanation |
| content_id | string | OPTIONAL | The content ID that triggered the error |
| ope_discovery | string | OPTIONAL | URL to the publisher's OPE discovery endpoint, for clients that need to (re-)discover capabilities |

## 11. Web-Based Entitlement

OPE Sections 1–10 define flows for programmatic consumers—feed readers, AI agents, browser extensions using the `Authorization` header. This section extends OPE to the most common entitlement scenario: a human reading a web page in a browser.

The core principle is **one token, two transports.** The same OPE grant token that an API client presents via `Authorization: Bearer <token>` can be delivered to a browser via an `HttpOnly` cookie. Publishers verify the same token using the same logic regardless of how it arrives.

### 11.1 HTTP 402 and OPE Response Headers

When a browser (or any HTTP client) requests a gated resource without a valid entitlement, publishers SHOULD signal entitlement requirements using HTTP headers. Publishers MAY use HTTP 402 (Payment Required) or HTTP 200 with a paywall in the response body. In either case, the following OPE headers SHOULD be included:

```http
HTTP/1.1 402 Payment Required
Link: </.well-known/ope>; rel="ope-discovery"
OPE-Content-Id: post-123
OPE-Access-Level: subscriber
OPE-Unlock-URL: /api/ope/unlock?content_id=post-123
Content-Type: text/html
```

| Header | Required | Description |
| --- | --- | --- |
| `Link` | RECOMMENDED | Discovery endpoint with `rel="ope-discovery"` |
| `OPE-Content-Id` | RECOMMENDED | The content identifier for the gated resource |
| `OPE-Access-Level` | OPTIONAL | The required access level (e.g., `subscriber`, `institutional`) |
| `OPE-Unlock-URL` | OPTIONAL | URL to initiate the browser unlock flow |

Publishers SHOULD also include a `<link>` element in the HTML `<head>` for HTML responses:

```html
<link rel="ope-discovery" href="/.well-known/ope" />
<meta name="ope:content-id" content="post-123" />
```

This allows browser extensions, aggregator apps, and progressive web apps to discover how to unlock content programmatically—even when the server returns 200 with a paywall `<div>`.

**Note on HTTP 402:** The 402 status code has historically been "reserved for future use" in HTTP. Content entitlement is precisely the use case it was reserved for. However, publishers concerned about client compatibility MAY use 200 with OPE headers instead. Clients MUST check for OPE headers regardless of the status code.

### 11.2 Cookie-Based Grant Token Transport

After a browser-based OAuth flow completes, the publisher's unlock endpoint SHOULD set the grant token as an `HttpOnly` cookie so subsequent page loads carry the entitlement automatically:

```http
HTTP/1.1 302 Found
Set-Cookie: ope_grant=<grant_token>; HttpOnly; Secure; SameSite=Lax; Max-Age=3600; Path=/
Location: /post-123
```

Cookie requirements:

- **`HttpOnly`:** REQUIRED. Prevents JavaScript access, mitigating XSS-based token theft.
- **`Secure`:** REQUIRED. Ensures the cookie is only sent over HTTPS.
- **`SameSite=Lax`:** REQUIRED. Prevents CSRF while allowing top-level navigations (e.g., clicking a link from a feed reader).
- **`Max-Age`:** SHOULD match the grant token's TTL. MUST NOT exceed the token's `exp` claim.
- **`Path`:** SHOULD be set to `/` unless the publisher scopes content to a subpath.

When processing content requests, publishers MUST check for entitlement in this order:

1. `Authorization: Bearer <token>` header (API clients)
2. `ope_grant` cookie (browser clients)

The same token verification logic applies regardless of transport. This is not a separate authentication system—it is the same grant token delivered via a different HTTP mechanism.

### 11.3 Browser Unlock Flow

The browser unlock flow connects feed discovery to web page access. When a feed reader or aggregator app wants to open gated content in a browser, it directs the user to the `unlock_url` from the feed's `content_metadata` (Section 9) or to the publisher's `web.unlock_endpoint` from the discovery document (Section 6).

```
1. User clicks "Read on web" in a feed reader
2. Feed reader opens: https://publisher.com/post-123?ope_unlock=1
3. Publisher detects ope_unlock parameter, checks for existing cookie
4. If no cookie: redirect to OAuth authorization endpoint
5. User authenticates and consents (Section 7.5)
6. OAuth callback → publisher issues grant token
7. Publisher sets ope_grant cookie and redirects to /post-123
8. Browser loads /post-123 with cookie → full content rendered
```

For users who already have an active session (cookie present and valid), step 3 short-circuits directly to step 8.

### 11.4 Cross-Publisher Browser Flow

The most powerful application of web-based entitlement is cross-publisher access via an Entitlement Broker (Section 14). This enables a "Sign in with your [Aggregator] subscription" flow:

```
1. Reader on publisher-a.com hits paywall
2. Publisher redirects to broker.example/authorize
     ?publisher=publisher-a.com
     &content_id=post-123
     &redirect_uri=https://publisher-a.com/api/ope/broker-callback
3. Broker verifies reader's subscription covers publisher-a.com
4. Broker issues a broker grant token (portable mode, signed by broker key)
5. Broker redirects to publisher-a.com/api/ope/broker-callback?grant=<token>
6. Publisher verifies broker token against broker's public key
7. Publisher sets ope_grant cookie with the verified grant
8. Reader sees full content
```

This flow is structurally identical to OpenID Connect—the broker acts as an identity-and-entitlement provider. The `broker` grant type (already defined in Section 8) carries the authorization. See Section 14.1 for the broker's verification responsibilities.

### 11.5 CORS Requirements for Web Clients

Publishers MUST set appropriate CORS headers on OPE API endpoints to support browser-based consumers (extensions, SPAs, aggregator web apps):

```http
Access-Control-Allow-Origin: <requesting-origin>
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

The discovery endpoint (`/.well-known/ope`) SHOULD allow any origin (`Access-Control-Allow-Origin: *`). Content and entitlement endpoints SHOULD restrict origins to registered clients or use credential-based CORS with specific origins.

## 12. Security Considerations

This section is normative. Implementations that do not address these concerns SHOULD NOT be deployed in production.

### 12.1 Token Security

- **Transport:** All OPE endpoints MUST be served over HTTPS. Grant tokens MUST NOT be transmitted over unencrypted connections.
- **Storage:** Readers MUST store grant tokens in secure, application-private storage. Tokens MUST NOT be logged, included in URLs, or stored in browser `localStorage`. For browser-based transport, tokens MUST be stored in `HttpOnly; Secure; SameSite=Lax` cookies only (see Section 11.2). JavaScript-accessible storage (`localStorage`, `sessionStorage`, non-`HttpOnly` cookies) is prohibited for grant tokens.
- **Token Binding:** Publishers SHOULD bind tokens to a client identifier using DPoP (RFC 9449). When DPoP is supported, the `cnf` claim in the grant token binds it to the client's DPoP key, preventing token theft from being useful across clients.
- **Short-lived tokens:** Grant tokens SHOULD have a TTL of no more than 1 hour. Readers use the refresh endpoint to obtain new tokens. This limits the window of exposure if a token is compromised. Short TTLs are the primary mitigation for token compromise—revocation lists are belt-and-suspenders.

### 12.2 Token Revocation

Publishers MUST implement the revocation endpoint. Revocation is critical for:

- Institutional access when employees leave organizations
- Gift links that have been shared beyond their intended audience
- Compromised tokens detected through anomalous usage patterns
- User-initiated subscription cancellation with immediate effect

```
POST /api/entitlement/revoke
Authorization: Bearer <publisher_admin_token>
Content-Type: application/json
```

```json
{ "jti": "grant_abc123", "reason": "employee_departed" }
```

```
200 OK
```

```json
{ "revoked": true, "jti": "grant_abc123" }
```

**Revocation enforcement note:** JWT-based grant tokens are stateless—a revoked token remains cryptographically valid until expiry. Publishers SHOULD maintain a revocation list and content endpoints SHOULD check it on each request. However, enforcement depends on content endpoints actually performing this check. Short TTLs (recommended: 1 hour maximum) are the strongest mitigation because they bound the window during which a revoked token can still be used. For deployments where immediate revocation is critical (institutional access), publishers SHOULD use TTLs of 15-30 minutes.

### 12.3 Refresh Token Rotation

When a reader refreshes a grant token, the publisher MUST issue a new refresh token and invalidate the previous one. This prevents replay attacks where a stolen refresh token could be used indefinitely.

```
POST /api/entitlement/refresh
Content-Type: application/json
```

```json
{ "refresh_token": "old_refresh_abc", "client_id": "pullread_ios" }
```

```
200 OK
```

```json
{
  "grant_token": "<new_jwt>",
  "refresh_token": "new_refresh_def",
  "expires_in": 3600
}
```

### 12.4 Scope Constraints

Grant tokens MUST only authorize the minimum access required. A subscription grant SHOULD NOT implicitly grant administrative access. Publishers SHOULD reject tokens with unrecognized scopes.

### 12.5 Institutional Access

For institutional grants (e.g., university library access), publishers SHOULD verify the reader's network origin against the institutional_domain claim. Publishers MAY use IP range verification, SAML/SSO federation, or both. Institutional tokens SHOULD have shorter TTLs (15-30 minutes) because the population of authorized users changes frequently.

## 13. Multi-Publisher Session Management

The most compelling use case for OPE is a reader that seamlessly presents gated content from multiple publishers. This requires careful session management.

### 13.1 Reader Session Architecture

A reader MUST maintain per-publisher OAuth sessions independently. Readers SHOULD store:

- **Publisher registry:** A local mapping of publisher domains to their OPE discovery endpoints and OAuth credentials.
- **Token store:** Per-publisher grant tokens and refresh tokens, each with its own expiry.
- **Entitlement cache:** A mapping of content_id to entitlement status, refreshed lazily when tokens are refreshed.

When a reader encounters a new OPE-enabled feed, it SHOULD:

1. Fetch the publisher's `/.well-known/ope` discovery endpoint.
2. Fetch the publisher's OAuth discovery (via `oauth_server` or inline `auth`).
3. Add the publisher to the local registry.
4. Display content metadata for gated items, with a prompt to authenticate.
5. On user action, initiate OAuth flow with the publisher.

### 13.2 Unified Subscription View

Readers SHOULD provide a unified view of all active entitlements across publishers. The discovery document's `metadata.plans` field enables readers to display subscription status and pricing without opening the publisher's website.

## 14. Entitlement Brokers

An Entitlement Broker is an optional intermediary that aggregates subscriptions across multiple publishers, similar to how a cable bundle aggregates TV channels. Brokers address the friction of managing individual subscriptions with many publishers.

### 14.1 Broker Flow

```
Reader → Broker (authenticate once)
Broker → Publisher (verify broker relationship)
Broker → Reader (issue broker grant token)
Reader → Publisher (present broker grant token for content)
```

Publishers that support brokers MUST:

- Declare `broker_support: true` in their discovery endpoint
- Accept the `"broker"` grant type
- Verify the broker's identity using a pre-established trust relationship (e.g., a signed broker certificate or a registered broker_id)
- Validate that the broker's token includes the required content scope

Brokers MUST NOT cache or store full content retrieved on behalf of users. Brokers facilitate entitlement only.

### 14.2 Broker Token Structure

Broker-issued tokens include an additional `broker_id` claim identifying the broker, and MAY attenuate the grant (e.g., limiting access to specific content categories). Macaroons are the recommended format for broker tokens because they natively support capability attenuation.

### 14.3 Broker Trust Establishment

Before a publisher accepts broker tokens, a trust relationship MUST be established. Brokers MUST publish a JSON Web Key Set (JWKS) at a well-known URL:

```
GET https://broker.example/.well-known/jwks.json
```

Publishers verify broker tokens by fetching the broker's public keys and validating the token signature. Publishers SHOULD cache broker JWKS for no more than 24 hours.

Publishers MUST maintain an allowlist of trusted broker identifiers. Publishers MAY support automatic broker registration through a registration endpoint, but MUST require manual approval before accepting tokens from a new broker.

### 14.4 Browser-Based Broker Flow

The cross-publisher browser flow (Section 11.4) relies on brokers to provide a redirect-based entitlement exchange. This subsection specifies the broker's responsibilities in that flow.

**Broker authorization endpoint:** Brokers MUST expose an authorization endpoint that accepts the following parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `publisher` | REQUIRED | The publisher's domain |
| `content_id` | OPTIONAL | Specific content being unlocked |
| `redirect_uri` | REQUIRED | Publisher's callback URL |
| `state` | REQUIRED | Opaque value for CSRF protection |

**Broker verification:** Upon receiving an authorization request, the broker MUST:

1. Authenticate the reader (or verify an existing session)
2. Verify the reader's subscription covers the requested publisher
3. Issue a portable-mode grant token signed with the broker's private key
4. Redirect to the publisher's `redirect_uri` with `grant=<token>&state=<state>`

**Publisher callback:** The publisher's callback endpoint MUST:

1. Validate the `state` parameter
2. Verify the broker token's signature against the broker's JWKS
3. Verify the `broker_id` claim matches a trusted broker
4. Verify the token's `iss`, `scope`, and `exp` claims
5. Set the `ope_grant` cookie (Section 11.2) and redirect the reader to the content

## 15. AT Protocol Integration

OPE may operate over ATProto. This section describes how OPE relates to ATProto's permission spaces architecture and proposes a concrete integration path.

### 15.1 Relationship to ATProto Permission Spaces

The ATProto team is developing a permissioned data system based on permission spaces—protocol-level authorization and sync boundaries for permissioned records representing shared social contexts in the network. OPE is designed to work as an application-layer complement to this infrastructure:

- **ATProto permission spaces:** Define how a PDS enforces access control at the protocol level—which records are visible to which DIDs, via space member lists with (DID, read|write) tuples.
- **OPE:** Defines the application-layer semantics of entitlement—why a user has access, what kind of access, how it was granted, and when it expires in business terms.

The two systems are complementary, not competitive:

- A permission space's member list answers: "Is this DID allowed to see these records?" (binary yes/no)
- An OPE grant token answers: "Why does this person have access, through what mechanism, and under what terms?"

### 15.2 Integration Flow

When a user obtains an OPE grant (via subscription, gift, broker, etc.), the publisher's managing app uses that grant to manage the permission space member list:

1. User obtains OPE grant token (via OAuth + subscription/payment/gift/broker)
2. Publisher's app validates the grant and adds user's DID to the space member list with `read` access
3. ATProto's space credential system handles protocol-level record access
4. When the OPE grant expires or is revoked, the publisher's app removes the DID from the member list

Space credentials are short-lived (2-4 hour expiration), stateless, asymmetrically signed by the space owner, and verifiable without coordinating with the owner. This complements OPE's own short-lived grant tokens.

### 15.3 Space Configuration for Gated Content

Paid content spaces SHOULD be configured as "default deny" for service access, with only the publisher's reader app and explicitly approved OPE-compatible readers on the allowlist.

The space type NSID (e.g., `org.feedspec.ope.content`) serves as the OAuth consent boundary—when a user logs into a reader application, they grant access based on the type of space.

### 15.4 URI Considerations

ATProto's permissioned data uses a different URI scheme from public data (likely `ats://` rather than `at://`). Permissioned record addressing requires six components: space owner DID, space type NSID, space key, user DID, collection NSID, and record key.

OPE's `content_id` can map to the space key or to individual record keys within a space, depending on publisher architecture. Publishers SHOULD document their mapping in the OPE discovery endpoint.

### 15.5 Namespace

Suggested namespace: `org.feedspec.ope.*`

**Important:** In ATProto, namespaces map to domain authority via reverse-DNS. This namespace uses `feedspec.org`, which is controlled by the editor.

### 15.6 Lexicon: org.feedspec.ope.entitlement.grant

```json
{
  "lexicon": 1,
  "id": "org.feedspec.ope.entitlement.grant",
  "defs": {
    "main": {
      "type": "record",
      "record": {
        "type": "object",
        "required": ["publisher", "subject", "grantType", "expiresAt"],
        "properties": {
          "publisher": { "type": "string", "description": "Publisher DID" },
          "subject": { "type": "string", "description": "User DID" },
          "grantType": { "type": "string",
            "knownValues": ["subscription","gift","per_item","institutional","metered","locale_free","patronage","broker"] },
          "scope": { "type": "array", "items": { "type": "string" } },
          "contentId": { "type": "string" },
          "brokerId": { "type": "string", "description": "Broker DID, if broker grant" },
          "spaceKey": { "type": "string", "description": "Permission space key, if space-scoped" },
          "expiresAt": { "type": "string", "format": "datetime" }
        }
      }
    }
  }
}
```

### 15.7 Lexicon: org.feedspec.ope.content.get

```json
{
  "lexicon": 1,
  "id": "org.feedspec.ope.content.get",
  "defs": {
    "main": {
      "type": "query",
      "parameters": {
        "type": "params",
        "required": ["contentId"],
        "properties": {
          "contentId": { "type": "string" },
          "format": { "type": "string", "default": "html" }
        }
      },
      "output": {
        "encoding": "application/json",
        "schema": {
          "type": "object",
          "required": ["contentId"],
          "properties": {
            "contentId": { "type": "string" },
            "contentHtml": { "type": "string" },
            "contentMarkdown": { "type": "string" },
            "publishedAt": { "type": "string", "format": "datetime" }
          }
        }
      },
      "errors": [
        { "name": "NotEntitled", "description": "Valid auth but insufficient entitlement" },
        { "name": "ContentNotFound" }
      ]
    }
  }
}
```

### 15.8 Lexicon: org.feedspec.ope.content.getBatch

```json
{
  "lexicon": 1,
  "id": "org.feedspec.ope.content.getBatch",
  "defs": {
    "main": {
      "type": "query",
      "parameters": {
        "type": "params",
        "required": ["contentIds"],
        "properties": {
          "contentIds": { "type": "array", "items": { "type": "string" }, "maxLength": 50 },
          "format": { "type": "string", "default": "html" }
        }
      },
      "output": {
        "encoding": "application/json",
        "schema": {
          "type": "object",
          "required": ["items"],
          "properties": {
            "items": { "type": "array", "items": { "$ref": "#defs/contentResult" } }
          }
        }
      }
    },
    "contentResult": {
      "type": "object",
      "required": ["contentId", "status"],
      "properties": {
        "contentId": { "type": "string" },
        "status": { "type": "string", "knownValues": ["ok", "not_entitled", "not_found"] },
        "contentHtml": { "type": "string" },
        "reason": { "type": "string" }
      }
    }
  }
}
```

## 16. Caching

Feeds remain publicly cacheable. Authorized content SHOULD return `Cache-Control: private`. Readers SHOULD cache entitled content locally to reduce redundant API calls, respecting the publisher's cache directives.

The OPE discovery document SHOULD be cached by readers for at least 1 hour and at most 24 hours. Publishers SHOULD set appropriate Cache-Control headers on the discovery endpoint.

## 17. Backwards Compatibility

Readers without OPE support will ignore OPE elements, show preview content, and open the publisher page as a fallback. No existing feed functionality is broken. OPE is a purely additive extension.

## 18. Migration Path

Existing systems already implement partial equivalents:

| Platform | Existing Behavior | OPE Migration |
| --- | --- | --- |
| WordPress | Member RSS feeds | Add OPE namespace to existing feeds, expose discovery |
| Ghost | Subscriber RSS | Map tiers to grant types, add discovery endpoint |
| Substack | Private feed tokens | Replace tokens with OPE OAuth flow |
| Daring Fireball-style | HTTP Basic Auth on feed URLs | Add discovery, upgrade to OAuth2 |
| Patreon | Per-tier RSS feeds | Map tiers to access levels in OPE metadata |

Migration strategy:

1. Continue existing feeds unmodified.
2. Add OPE extension metadata to feed items.
3. Expose `/.well-known/ope` discovery endpoint.
4. Implement OAuth2 and grant token issuance (or deploy the reference gateway).
5. Optionally register with an Entitlement Broker.

## 19. Implementer Guide

This non-normative section describes the minimum work required to implement OPE, for both publishers and reader developers.

### 19.1 Reference Gateway

Standing up OAuth + token management + content APIs is a significant lift for publishers. The OPE project provides an open-source reference gateway—a deployable container that handles:

- OPE discovery endpoint serving
- OAuth2 with PKCE (and optionally PAR, RAR, DPoP)
- Grant token issuance, refresh, and revocation
- Content API proxying with grant validation
- Revocation list management

The reference gateway is designed to sit alongside an existing publishing stack. Publishers configure it with their content endpoints and subscription backend; the gateway handles all OPE protocol mechanics.

Reference gateway: https://github.com/feedspec/ope-gateway (planned)

### 19.2 For Reader Developers

Minimum viable implementation:

1. **Feed parsing:** Detect `ope` namespace/extension in feeds. Extract `content_id`, required level, and `content_metadata`.
2. **Discovery:** On encountering an OPE-enabled feed, fetch `/.well-known/ope` and cache the discovery document.
3. **Display:** Show preview content and content_metadata (word count, read time, CTA) for gated items.
4. **OAuth:** Implement OAuth2 Authorization Code flow with PKCE. Store tokens securely per-publisher.
5. **Content retrieval:** Fetch full content using the grant token. Prefer batch endpoint when syncing.
6. **Token lifecycle:** Refresh tokens before expiry. Handle 401 by re-authenticating.

**Estimated effort:** For a reader that already supports OAuth2, OPE adds approximately 2-4 weeks of development for a single developer. The heaviest lift is per-publisher session management and token storage.

### 19.3 For Publishers

Minimum viable implementation (without reference gateway):

1. **Discovery endpoint:** Serve `/.well-known/ope` (static JSON).
2. **OAuth2:** Implement Authorization Code flow with PKCE.
3. **Grant issuance:** On successful auth, look up user's subscription status and issue a JWT grant token.
4. **Content API:** Serve full content at the `endpoint_template` URL, validating the grant token.
5. **Feed extension:** Add OPE metadata to existing feed items.

**Estimated effort:** For a publisher running a standard web stack, the discovery and content API add approximately 1-2 weeks. Using the reference gateway reduces this to configuration only.

## 20. Reference Implementations

- Reference reader: Pull Read (https://pullread.com)
- Reference publisher: Drafty (https://drafty.com)
- Reference gateway: OPE Gateway (planned)

Publisher reference architecture:

- Feed generator (existing RSS/Atom/JSON Feed output with OPE extensions)
- OPE discovery (static JSON at well-known endpoint)
- Entitlement service (OAuth2 + grant token issuance, refresh, revocation)
- Content API (authenticated content retrieval with batch support)

## 21. Payment Models (Informative)

OPE supports multiple payment models. The `grant_type` field in the token indicates how entitlement was obtained:

| Model | grant_type | Description |
| --- | --- | --- |
| Subscription | subscription | Recurring payment, access to all content |
| Per-item | per_item | Pay per article, token scoped to content_ids |
| Gift | gift | Shareable unlock, typically time-limited |
| Institutional | institutional | Domain/IP-based access (libraries, universities) |
| Metered | metered | Free article limit, meter_remaining in token |
| Locale-free | locale_free | Regional free access based on user locale |
| Patronage | patronage | Voluntary support, may grant all access |
| Broker | broker | Access via entitlement broker bundle |

Compatible payment processors include Stripe, Paddle, Lemon Squeezy, PayPal, WooCommerce, Adyen, and self-hosted billing. Compatible payment protocols include x402, Stripe MPP, and any system that can trigger OPE grant issuance upon successful payment. Micropayment options include Lightning Network, Web Monetization (W3C WICG), and Nostr zaps.

## 22. Complete Worked Example

This non-normative section walks through the complete OPE flow from feed discovery to content display.

**Scenario:** A user named Alice uses Pull Read (reader app). She subscribes to a JSON Feed from Shellen Publishing. One item in the feed is gated for subscribers. Alice has a subscription.

### Step 1: Alice adds the feed

Pull Read fetches the JSON Feed:

```
GET https://shellen.com/feed.json
```

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "Shellen Publishing",
  "items": [
    {
      "id": "post-456",
      "title": "The Future of Feeds",
      "content_text": "Full text of a free article..."
    },
    {
      "id": "post-789",
      "title": "Protocol Economics",
      "content_text": "Preview: Why separating entitlement from distribution...",
      "extensions": {
        "ope": {
          "required": { "level": "subscriber" },
          "grants_allowed": ["subscription", "gift"],
          "content_id": "post-789",
          "content_metadata": {
            "word_count": 4500,
            "estimated_read_time_minutes": 18,
            "unlock_cta": "Subscribe for $5/month to read full articles"
          }
        }
      }
    }
  ]
}
```

### Step 2: Pull Read discovers OPE support

Pull Read detects the `ope` extension and fetches discovery:

```
GET https://shellen.com/.well-known/ope
```

```json
{
  "version": "0.1",
  "oauth_server": "https://shellen.com/.well-known/oauth-authorization-server",
  "entitlement": { "..." },
  "content": { "..." },
  "metadata": { "..." }
}
```

Pull Read then fetches the OAuth server metadata per RFC 8414 to obtain authorization and token endpoints.

### Step 3: Alice taps the gated article

Pull Read shows the preview text, word count (4,500 words), read time (18 min), and unlock CTA. Alice taps "Subscribe for $5/month."

Pull Read initiates OAuth2 Authorization Code flow with PKCE:

```
GET https://shellen.com/oauth/authorize
  ?response_type=code
  &client_id=pullread_ios
  &redirect_uri=pullread://oauth/callback
  &scope=content:read content:batch
  &code_challenge=<S256_challenge>
  &code_challenge_method=S256
  &state=<random>
```

### Step 4: Alice authenticates

The publisher's OAuth page opens in an in-app browser. Alice logs in (or creates an account and subscribes). The publisher redirects back:

```
pullread://oauth/callback?code=AUTH_CODE_xyz&state=<random>
```

Pull Read exchanges the code for tokens:

```
POST https://shellen.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_xyz
&client_id=pullread_ios
&redirect_uri=pullread://oauth/callback
&code_verifier=<original_verifier>
```

```json
{
  "access_token": "<oauth_access_token>",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Step 5: Pull Read requests an entitlement grant

Using the OAuth access token, Pull Read requests a grant (portable mode):

```
POST https://shellen.com/api/entitlement/grant
Authorization: Bearer <oauth_access_token>
```

```json
{
  "grant_token": "<jwt_grant_token>",
  "refresh_token": "refresh_abc",
  "expires_in": 3600,
  "grant_type": "subscription",
  "scope": ["content:read", "content:batch"]
}
```

Pull Read stores the grant token and refresh token securely, associated with shellen.com in its publisher registry.

### Step 6: Pull Read retrieves the full article

```
GET https://shellen.com/api/content/post-789
Authorization: Bearer <jwt_grant_token>
```

```json
{
  "id": "post-789",
  "title": "Protocol Economics",
  "content_html": "<h1>Protocol Economics</h1><p>Why separating entitlement from distribution changes everything...</p>",
  "published": "2026-03-01T12:00:00Z",
  "author": { "name": "Jason Shellen" }
}
```

Alice reads the full article in Pull Read. Future gated articles from shellen.com will be automatically accessible until the grant token expires, at which point Pull Read refreshes it silently.

## 23. Why OPE Matters

Historically, publishing stacks combine content, payments, and distribution into monolithic platforms. When a reader subscribes to a Substack newsletter, that subscription is locked to the Substack ecosystem. When a publisher leaves Substack, subscribers don't follow automatically.

OPE separates these layers so that:

- **Subscriptions are portable:** a reader's entitlement works in any OPE-compatible client.
- **Readers choose their tools:** any reader app can present gated content, not just the publisher's website.
- **Publishers retain control:** entitlement issuance and content delivery remain with the publisher.
- **New models emerge:** brokers can create subscription bundles; gift links work cross-platform; institutional access standardizes.
- **Agents can participate:** OPE grant tokens work for machine clients as naturally as human ones, complementing agentic payment protocols.

## 24. Future Work

- Reference gateway implementation (open-source OPE container for publishers).
- Reference broker implementation demonstrating multi-publisher bundles and browser-based cross-publisher unlock.
- Browser extension reference implementation demonstrating HTTP 402 detection, OPE header parsing, and cookie-based unlock.
- Formal alignment with ATProto permission spaces as the system reaches specification stage.
- Standardized reader-to-reader entitlement portability (transferring an active subscription between reader clients without re-authentication).
- Content format negotiation (request markdown vs. HTML vs. structured blocks).
- Integration with ActivityPub for cross-protocol entitlement verification.
- Publisher analytics extensions (anonymized read metrics returned to publisher without tracking individual users).
- Agent-to-agent entitlement flows, where OPE grants serve as capability attestations in A2A communication.
- Metered reading analytics: standardized mechanism for publishers to track `meter_remaining` decrements across API and browser contexts.

## Acknowledgments

Thanks to [Max Engel](https://github.com/maxengel) for feedback on OAuth discovery alignment, token architecture, revocation enforcement, and the reference gateway concept. Thanks to the Drafty team for implementation feedback that identified critical gaps in web-based permissioning flows, consent requirements, and error response standardization. Thanks to the ATProto team, particularly Daniel Holmgren, for the permission spaces design that informs Section 15.

---

## Author

Jason Shellen
https://shellen.com
ATProto / Bluesky: @shellen.com
