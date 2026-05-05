# Open Portable Entitlement (OPE)

**Draft Specification v0.1**

Status: Working Draft
Editor: Jason Shellen
https://shellen.com • @shellen.com (ATProto / Bluesky)
Date: March 27, 2026

*A portable entitlement layer for resources discovered through feeds and decentralized publishing. OPE standardizes entitlement verification—not payment systems—enabling portable subscriptions and content access across platforms, clients, and protocols.*

**This draft includes:** RFC 8414 OAuth Discovery alignment, Simple and Portable token modes, PAR/RAR/DPoP support, Web-Based Entitlement (HTTP 402, cookie transport, browser unlock flows), Consent Screen requirements, Dynamic Client Registration (RFC 7591), PKCE requirement, Cross-Publisher Browser Flow via Entitlement Brokers, Security Considerations, Implementer Guide with Reference Gateway, Entitlement Aggregation, Content Metadata for unentitled states (text and media), Media Content Retrieval (signed URLs, streaming, media alternatives), RSS Enclosure Interaction for podcasts, Batch Content Retrieval, Multi-publisher Session Management, ATProto Permission Spaces integration path, Payment Protocol landscape positioning, Grant Primitives (access, limit, signal) with composable fields replacing 14 named types, Complete Worked Examples (article and podcast), and Migration Paths for podcast hosts, video platforms, and course providers.

---

## 1. Abstract

Open Portable Entitlement (OPE) proposes a portable method for clients to access protected resources referenced in feeds. The specification enables publishers to distribute preview content through RSS, Atom, JSON Feed, or AT Protocol; authenticate users; issue entitlement grants; and allow authorized clients to retrieve full content—whether those clients are API consumers, feed readers, podcast players, video apps, browser extensions, or web browsers.

OPE standardizes entitlement verification, not payment systems. This enables portable subscriptions and resource access across platforms and clients while preserving compatibility with existing feed ecosystems.

While the examples in this specification often reference articles and text content, the entitlement architecture is deliberately resource-agnostic. OPE works equally well for articles, podcast episodes, video, music, courses, image galleries, software, or any other gated resource. The grant token mechanism does not constrain what is being entitled—content, media, API access, capabilities, or any other protected resource. OPE grant tokens are transport-agnostic: they can be presented via HTTP `Authorization` headers (API clients) or optionally via `HttpOnly` cookies (browsers), using the same token format and verification logic in both cases. The web-based entitlement extension (Section 11) is optional and designed to complement—not replace—existing site authentication systems.

## 2. Status of This Document

This document is a working draft intended for discussion among feed ecosystem maintainers, publishing platforms, reader developers, and decentralized protocol communities. The specification may change substantially prior to wider review.

## 3. Design Philosophy

OPE does not attempt to replace existing feed formats or payment protocols. Instead, it adds a portable entitlement layer that occupies the space between content distribution and payment processing. The architecture deliberately separates four concerns:

- **Content:** the articles, podcast episodes, videos, music, courses, and other resources themselves
- **Distribution:** feed formats (RSS, Atom, JSON Feed, ATProto records) that catalog and deliver previews or trailers
- **Entitlement:** verification that a user has the right to access content
- **Payments:** the mechanisms by which money changes hands (explicitly out of scope)

This separation allows publishers and readers to experiment with new monetization models without locking content distribution to a specific platform.

**A note on naming:** OPE is not a feed format. There is no such thing as an "OPE feed." There are RSS feeds, Atom feeds, JSON Feeds, and ATProto records that are OPE-enabled—meaning they include OPE extension metadata alongside their existing format. OPE is a portable entitlement layer that works with any feed format, not a replacement for any of them.

### 3.1 Relationship to Payment Protocols

OPE is complementary to emerging payment protocols such as x402 (Coinbase), Stripe's Machine Payments Protocol (MPP), and the Agentic Commerce Protocol (ACP). These protocols handle the movement of money. OPE handles the proof of access that results from payment—or from any other entitlement origin (gift, institutional access, patronage, broker bundle).

x402 moves money. ACP handles checkout. OPE proves you're allowed in.

A publisher could accept payment via x402 micropayment and issue an OPE grant token as the result. The grant token doesn't care how money changed hands—only that the entitlement was legitimately issued.

### 3.2 Relationship to Content Licensing Standards

OPE is adjacent to — and overlaps in places with — emerging content licensing standards, particularly Really Simple Licensing (RSL). RSL is a machine-readable XML vocabulary for declaring how digital assets may be accessed and used, with discovery via `robots.txt`, HTTP `Link` headers, and embedded metadata.

Both standards describe what's licensable, who may access it, and at what cost. They specialize in different primitives:

- **RSL specializes in declarative content-side rules.** Terms apply to classes of requesters (any commercial user, any crawler in the EU, any AI training pipeline), travel with the content, and are discovered alongside it. RSL's distinctive verbs describe processing actions: `ai-train`, `ai-input`, `ai-index`, `search` — what a system may do with content once retrieved.
- **OPE specializes in subject-bound credentials.** Grants apply to specific identified subjects (this subscriber, this institution's network, this broker's bundle members), travel with the subject, and are presented to gain access. OPE's distinctive verbs describe access actions: subscribe, rent, gift, meter, signal — whether and how a subject may receive content in the first place.

The two operate at different stages of the content lifecycle. RSL governs the post-retrieval surface (what processing is permitted once content is in hand). OPE governs the pre-retrieval surface (how a subject obtains content at all). The same content can carry both layers without semantic conflict.

A single article can be covered by both. RSL terms can govern whether an AI system may train on it; OPE feed extensions and grants can govern whether a specific subscriber may read it in their reader of choice. The two compose.

Where they overlap — both can express "this content costs $5 per access" — RSL approaches it from the content side ("here is the price for any requester") and OPE from the subject side ("this subscriber has paid and holds this credential"). Publishers can run both side by side; the same payment event can produce an RSL `<payment>` declaration *and* mint an OPE grant token.

Adjacent work in this space includes Creative Commons, IPTC RightsML, W3C ODRL, and Schema.org for rights metadata, and the IETF AI Preferences vocabulary and Cloudflare Content Signals for crawler-facing usage signals.

## 4. Terminology

| Term | Definition |
| --- | --- |
| Resource | Any gated item: article, podcast episode, video, music track, course, API endpoint, capability |
| Feed | Catalog of content items in RSS, Atom, JSON Feed, or ATProto format |
| Manifest | Publisher metadata describing entitlement and content endpoints |
| Grant | Authorization allowing access to a resource |
| Grant Token | Signed token proving access rights |
| Client | Application retrieving and presenting feeds and entitled content (also referred to as "reader" when the context is text-based feeds) |
| Publisher | Content provider issuing entitlements |
| Entitlement Broker | Optional intermediary aggregating entitlements across publishers |
| Content Metadata | Structured preview information shown to unentitled users |

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
    "formats_available": ["html", "markdown", "text", "audio", "video", "streaming_hls", "streaming_dash"]
  },
  "metadata": {
    "subscribe_url": "https://example.com/subscribe",
    "pricing_url": "https://example.com/api/pricing",
    "plans": [
      { "id": "monthly", "name": "Monthly", "currency": "USD", "amount": 500 },
      { "id": "annual", "name": "Annual", "currency": "USD", "amount": 5000 }
    ]
  },
  "grants_supported": ["access", "limit", "signal"],
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
      "publisher": "did:web:publisher.example.com",
      "grant": {
        "type": "access",
        "scope": "all",
        "duration": "recurring",
        "source": "direct"
      },
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
| grant | object | Grant primitive (see Section 21). Contains `type` and composable fields |
| exp | integer | Expiry timestamp (Unix epoch) |
| iat | integer | Issued-at timestamp |
| jti | string | Unique token identifier (for revocation) |

The `grant` claim replaces the former `grant_type` string. It carries the full grant primitive object, enabling validators to check a single structured claim rather than inferring behavior from a flat string. See Section 21 for the complete field grammar.

### 8.3 Optional Claims

| Claim | Type | Description |
| --- | --- | --- |
| content_ids | string[] | Specific content items (for `access` grants with scope `item` or `collection`) |
| meter_remaining | integer | Entitlements remaining (for `limit` grants with kind `metered`; decrements per content retrieval) |
| institutional_domain | string | Domain for institutional verification (for `signal` grants with kind `institutional`) |
| broker_id | string | Broker that issued the grant (for grants with source `broker`) |
| refresh_token | string | Token for refreshing the grant |
| cnf | object | DPoP confirmation claim (RFC 9449) |
| rental_expires_at | integer | Unix timestamp when rental access ends (for `access` grants with `rental:Nh` duration; may differ from token exp) |
| bundle_id | string | Identifier for the content bundle (for `access` grants with scope `collection`) |
| group_id | string | Household or group identifier (for `signal` grants with kind `group-member`) |

### 8.4 Example Token (Portable Mode)

```json
{
  "iss": "publisher.example.com",
  "sub": "user123",
  "scope": ["content:read", "content:batch"],
  "grant": {
    "type": "access",
    "scope": "all",
    "duration": "recurring",
    "source": "direct"
  },
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

Feeds declare entitlement requirements per item. OPE introduces structured content metadata so clients can present meaningful information to unentitled users.

### 9.1 JSON Feed

**Article example:**

```json
{
  "id": "post-123",
  "title": "Deep Essay on Protocol Design",
  "content_text": "Preview: The history of feed formats reveals...",
  "extensions": {
    "ope": {
      "required": { "level": "subscriber" },
      "grants_allowed": ["access", "signal"],
      "content_id": "post-123",
      "content_metadata": {
        "resource_type": "article",
        "word_count": 3200,
        "estimated_read_time_minutes": 14,
        "preview_image": "https://publisher.example.com/img/post-123-hero.jpg",
        "unlock_cta": "Subscribe to read the full essay",
        "unlock_url": "https://publisher.example.com/post-123?ope_unlock=1",
        "per_item_price": { "currency": "USD", "amount": 200 }
      }
    }
  }
}
```

**Podcast episode example:**

```json
{
  "id": "episode-42",
  "title": "Interview: The Future of Open Podcasting",
  "content_text": "Preview: A 2-minute clip from our conversation about...",
  "attachments": [
    {
      "url": "https://publisher.example.com/podcast/ep42-preview.mp3",
      "mime_type": "audio/mpeg",
      "size_in_bytes": 2400000
    }
  ],
  "extensions": {
    "ope": {
      "required": { "level": "subscriber" },
      "grants_allowed": ["access", "limit", "signal"],
      "content_id": "episode-42",
      "content_metadata": {
        "resource_type": "podcast_episode",
        "duration_seconds": 3420,
        "media_type": "audio/mpeg",
        "file_size_bytes": 54800000,
        "series_title": "Sound and Signal",
        "episode_number": 42,
        "season_number": 3,
        "preview_image": "https://publisher.example.com/podcast/ep42-art.jpg",
        "unlock_cta": "Subscribe for the full episode",
        "unlock_url": "https://publisher.example.com/podcast/ep42?ope_unlock=1",
        "per_item_price": { "currency": "USD", "amount": 200 }
      }
    }
  }
}
```

#### 9.1.1 Content Metadata Field Reference

**content_metadata** provides structured information for clients to display rich previews of gated content. All fields are optional.

**Common fields (all resource types):**

| Field | Type | Description |
| --- | --- | --- |
| resource_type | string | The type of resource. Known values: `article`, `essay`, `newsletter`, `podcast_episode`, `audio`, `video`, `music_track`, `album`, `course_lesson`, `course`, `gallery`, `software`, `dataset` |
| preview_image | string | URL to a preview/hero image or artwork |
| unlock_cta | string | Call-to-action string for unentitled users |
| unlock_url | string | Browser-openable URL triggering the web-based entitlement flow (Section 11) |
| per_item_price | object | Price for per-item purchase, using smallest currency unit (e.g., cents for USD): `{ "currency": "USD", "amount": 200 }` |

**Text-specific fields:**

| Field | Type | Description |
| --- | --- | --- |
| word_count | integer | Total word count of the full content |
| estimated_read_time_minutes | integer | Estimated reading time |

**Media-specific fields (audio, video, podcasts):**

| Field | Type | Description |
| --- | --- | --- |
| duration_seconds | integer | Duration of the media in seconds |
| media_type | string | MIME type of the full media file (e.g., `audio/mpeg`, `video/mp4`) |
| file_size_bytes | integer | Size of the full media file in bytes |
| series_title | string | Name of the podcast, video series, or course |
| episode_number | integer | Episode number within a season or series |
| season_number | integer | Season number, if applicable |
| bitrate_kbps | integer | Bitrate in kilobits per second |

**Gallery/collection fields:**

| Field | Type | Description |
| --- | --- | --- |
| item_count | integer | Number of items in a gallery, album, or collection |

### 9.2 Atom (RFC 4287)

Namespace:

```
xmlns:ope="https://feedspec.org/ope/ns/1.0"
```

**Article example:**

```xml
<entry>
  <id>https://publisher.example.com/post-123</id>
  <title>Deep Essay on Protocol Design</title>
  <updated>2026-03-03T00:00:00Z</updated>
  <link rel="alternate" href="https://publisher.example.com/post-123" type="text/html"/>
  <summary>Preview: The history of feed formats reveals...</summary>
  <ope:access level="subscriber">
    <ope:content-id>post-123</ope:content-id>
    <ope:grant-types>
      <ope:type>access</ope:type>
      <ope:type>signal</ope:type>
    </ope:grant-types>
    <ope:metadata>
      <ope:resource-type>article</ope:resource-type>
      <ope:word-count>3200</ope:word-count>
      <ope:unlock-cta>Subscribe to read the full essay</ope:unlock-cta>
      <ope:unlock-url>https://publisher.example.com/post-123?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</entry>
```

**Podcast episode example:**

```xml
<entry>
  <id>https://publisher.example.com/podcast/ep42</id>
  <title>Interview: The Future of Open Podcasting</title>
  <updated>2026-03-10T00:00:00Z</updated>
  <link rel="alternate" href="https://publisher.example.com/podcast/ep42" type="text/html"/>
  <link rel="enclosure" href="https://publisher.example.com/podcast/ep42-preview.mp3" type="audio/mpeg" length="2400000"/>
  <summary>Preview: A 2-minute clip from our conversation about...</summary>
  <ope:access level="subscriber">
    <ope:content-id>episode-42</ope:content-id>
    <ope:grant-types>
      <ope:type>access</ope:type>
      <ope:type>signal</ope:type>
      <ope:type>limit</ope:type>
    </ope:grant-types>
    <ope:metadata>
      <ope:resource-type>podcast_episode</ope:resource-type>
      <ope:duration-seconds>3420</ope:duration-seconds>
      <ope:media-type>audio/mpeg</ope:media-type>
      <ope:series-title>Sound and Signal</ope:series-title>
      <ope:episode-number>42</ope:episode-number>
      <ope:season-number>3</ope:season-number>
      <ope:unlock-cta>Subscribe for the full episode</ope:unlock-cta>
      <ope:unlock-url>https://publisher.example.com/podcast/ep42?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</entry>
```

### 9.3 RSS 2.0

**Article example:**

```xml
<item>
  <title>Deep Essay on Protocol Design</title>
  <link>https://publisher.example.com/post-123</link>
  <description>Preview: The history of feed formats reveals...</description>
  <ope:access level="subscriber">
    <ope:content-id>post-123</ope:content-id>
    <ope:metadata>
      <ope:resource-type>article</ope:resource-type>
      <ope:unlock-cta>Subscribe to read the full essay</ope:unlock-cta>
      <ope:unlock-url>https://publisher.example.com/post-123?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</item>
```

**Podcast episode example (with enclosure):**

OPE works alongside the standard RSS `<enclosure>` element used by podcast feeds. When an episode is gated, the enclosure MAY point to a preview clip or trailer, while the full episode is available through OPE content retrieval. Clients that do not support OPE will see the preview enclosure and degrade gracefully.

```xml
<item>
  <title>Interview: The Future of Open Podcasting</title>
  <link>https://publisher.example.com/podcast/ep42</link>
  <description>Preview: A 2-minute clip from our conversation about...</description>
  <enclosure url="https://publisher.example.com/podcast/ep42-preview.mp3" type="audio/mpeg" length="2400000"/>
  <ope:access level="subscriber">
    <ope:content-id>episode-42</ope:content-id>
    <ope:metadata>
      <ope:resource-type>podcast_episode</ope:resource-type>
      <ope:duration-seconds>3420</ope:duration-seconds>
      <ope:media-type>audio/mpeg</ope:media-type>
      <ope:file-size-bytes>54800000</ope:file-size-bytes>
      <ope:series-title>Sound and Signal</ope:series-title>
      <ope:episode-number>42</ope:episode-number>
      <ope:season-number>3</ope:season-number>
      <ope:unlock-cta>Subscribe for the full episode</ope:unlock-cta>
      <ope:unlock-url>https://publisher.example.com/podcast/ep42?ope_unlock=1</ope:unlock-url>
    </ope:metadata>
  </ope:access>
</item>
```

### 9.4 Enclosure Interaction

For podcast and media feeds, OPE metadata complements rather than replaces the existing `<enclosure>` element (RSS) or `attachments` array (JSON Feed). Publishers have two strategies for gated media:

1. **Preview enclosure:** The enclosure/attachment points to a free preview clip or trailer. The full media file is retrieved through the OPE content endpoint after entitlement verification. This is the RECOMMENDED approach as it maintains backwards compatibility with non-OPE clients.

2. **Omitted enclosure:** The enclosure is absent for gated items, and the full media URL is only available through the OPE content endpoint. Non-OPE clients see the text description only.

In both cases, the `content_metadata` fields (`duration_seconds`, `media_type`, `file_size_bytes`) describe the *full* entitled resource, not the preview.

## 10. Content Retrieval

### 10.1 Single Item

**Article retrieval:**

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
  "resource_type": "article",
  "content_html": "<p>Full article content...</p>",
  "published": "2026-03-03T00:00:00Z",
  "author": { "name": "Jane Martinez", "url": "https://publisher.example.com" }
}
```

**Media retrieval (podcast episode):**

```
GET /api/content/episode-42
Authorization: Bearer <grant_token>
Accept: application/json
```

```
200 OK
Cache-Control: private, max-age=3600
Content-Type: application/json
```

```json
{
  "id": "episode-42",
  "title": "Interview: The Future of Open Podcasting",
  "resource_type": "podcast_episode",
  "published": "2026-03-10T00:00:00Z",
  "author": { "name": "Jason Shellen" },
  "media": {
    "url": "https://publisher.example.com/podcast/ep42-full.mp3",
    "mime_type": "audio/mpeg",
    "size_bytes": 54800000,
    "duration_seconds": 3420,
    "bitrate_kbps": 128
  },
  "media_alternatives": [
    {
      "url": "https://publisher.example.com/podcast/ep42-full-hq.mp3",
      "mime_type": "audio/mpeg",
      "size_bytes": 82200000,
      "bitrate_kbps": 192
    }
  ],
  "content_html": "<p>Show notes: In this episode we discuss...</p>"
}
```

The `media` object provides the primary media file for non-text resources. The `media_alternatives` array allows publishers to offer multiple quality levels or formats (e.g., MP3 and AAC, SD and HD video). For streaming content, the `media.url` MAY point to an HLS manifest (`.m3u8`) or DASH manifest (`.mpd`). The `content_html` field MAY still be present for media resources to provide show notes, liner notes, video descriptions, or other supplementary text.

Media URLs returned by the content endpoint MAY be signed URLs with limited TTL. Publishers SHOULD set URL expiry to match or exceed the grant token's TTL. Clients MUST NOT cache or redistribute media URLs beyond the grant token's validity period.

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

This section is OPTIONAL. Publishers are not required to implement web-based OPE flows. Many publishers already have mature browser-based access control—session cookies, identity providers (Clerk, Auth0, Firebase Auth), or custom authentication middleware. OPE does not replace these systems.

OPE Sections 1–10 define the core protocol for programmatic consumers—feed readers, AI agents, and other API clients using the `Authorization` header. This section defines an optional extension that allows the same OPE grant tokens to also work in browser contexts, bridging the gap between API-based entitlement and web-based access.

**When to implement this section:**

- You want feed readers to deep-link users to full content on your site
- You want browser extensions or aggregator apps to unlock content on your pages
- You want to accept cross-publisher entitlements from brokers in a browser context
- You want a single entitlement system that serves both API and web clients

**When to skip this section:**

- Your existing site authentication already handles browser-based access
- You only need OPE for programmatic consumers (feed readers, AI agents)
- You prefer to keep site auth and API auth as separate concerns

Publishers MAY implement web-based OPE alongside an existing site authentication system. The two are not mutually exclusive—a publisher can check its own session cookie first and fall back to an OPE grant cookie, or vice versa. The `web` block in the discovery document (Section 6) signals to clients that the publisher supports these flows.

The core principle for publishers who opt in is **one token, two transports.** The same OPE grant token that an API client presents via `Authorization: Bearer <token>` can be delivered to a browser via an `HttpOnly` cookie. Publishers verify the same token using the same logic regardless of how it arrives.

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

Publishers that implement cookie-based transport SHOULD check for entitlement in this order:

1. The publisher's own session mechanism, if any (e.g., Clerk, Auth0, custom session cookies)
2. `Authorization: Bearer <token>` header (API clients)
3. `ope_grant` cookie (browser clients presenting OPE grants)

This allows OPE web-based entitlement to coexist with existing site authentication. A publisher running Clerk for its logged-in users can still accept OPE grant cookies from broker flows or feed reader handoffs — the two systems compose rather than conflict. The same OPE token verification logic applies regardless of whether the token arrives via header or cookie.

### 11.3 Browser Unlock Flow

The browser unlock flow connects feed discovery to web page access. When a feed reader or aggregator app wants to open gated content in a browser, it directs the user to the `unlock_url` from the feed's `content_metadata` (Section 9) or to the publisher's `web.unlock_endpoint` from the discovery document (Section 6).

```
1. User clicks "Read on web" in a feed reader
2. Feed reader opens: https://publisher.com/post-123?ope_unlock=1
3. Publisher detects ope_unlock parameter, checks for existing session or cookie
4. If already authenticated (site session or OPE cookie): skip to step 8
5. If no session: redirect to OAuth authorization endpoint (or publisher's own login)
6. User authenticates and consents
7. Publisher issues OPE grant token and sets ope_grant cookie, redirects to /post-123
8. Browser loads /post-123 with cookie → full content rendered
```

Step 5 is intentionally flexible. Publishers MAY use OPE's OAuth flow (Section 7), their existing login system, or a combination. A publisher using Clerk could authenticate the user via Clerk, check their subscription status internally, and then issue an OPE grant cookie — using OPE as the cross-system entitlement format while keeping their own auth for the login step.

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

This flow is structurally identical to OpenID Connect—the broker acts as an identity-and-entitlement provider. An `access` grant with source `broker` (already defined in Section 21) carries the authorization. See Section 14.1 for the broker's verification responsibilities.

### 11.5 CORS Requirements for Web Clients

Publishers that implement web-based entitlement SHOULD set appropriate CORS headers on OPE API endpoints to support browser-based consumers (extensions, SPAs, aggregator web apps):

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
- **Storage:** Readers MUST store grant tokens in secure, application-private storage. Tokens MUST NOT be logged, included in URLs, or stored in browser `localStorage`. Publishers that implement web-based entitlement (Section 11) MUST use `HttpOnly; Secure; SameSite=Lax` cookies for browser-based token transport. JavaScript-accessible storage (`localStorage`, `sessionStorage`, non-`HttpOnly` cookies) is prohibited for grant tokens in any context.
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
- Accept grants with source `"broker"`
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
    "grant": {
      "type": "object",
      "description": "Grant primitive object (see Section 21)",
      "required": ["type"],
      "properties": {
        "type": { "type": "string", "knownValues": ["access", "limit", "signal"] },
        "scope": { "type": "string", "knownValues": ["all", "item", "collection", "pre-release"],
          "description": "Content scope (access grants only)" },
        "kind": { "type": "string",
          "description": "Qualifier for limit or signal grants (e.g., metered, locale-gated, patron, institutional, ad-free, group-member)" },
        "duration": { "type": "string",
          "description": "Time behavior (access grants only): perpetual, recurring, time-limited, or rental:Nh" },
        "transferable": { "type": "boolean", "description": "Whether the grant can be shared (access grants only)" },
        "quota": { "type": "integer", "description": "Number of items allowed per period (limit grants only)" },
        "period": { "type": "string", "description": "Reset cadence (limit grants only): month, week, day" },
        "source": { "type": "string", "knownValues": ["direct", "broker", "institution", "family-plan"],
          "description": "Origin of entitlement" }
      }
    },
    "main": {
      "type": "record",
      "record": {
        "type": "object",
        "required": ["publisher", "subject", "grant", "expiresAt"],
        "properties": {
          "publisher": { "type": "string", "description": "Publisher DID" },
          "subject": { "type": "string", "description": "User DID" },
          "grant": { "type": "ref", "ref": "#grant", "description": "Grant primitive (see Section 21)" },
          "scope": { "type": "array", "items": { "type": "string" } },
          "contentId": { "type": "string" },
          "brokerId": { "type": "string", "description": "Broker DID, if source is broker" },
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
            "resourceType": { "type": "string", "description": "Resource type: article, podcast_episode, video, etc." },
            "contentHtml": { "type": "string" },
            "contentMarkdown": { "type": "string" },
            "publishedAt": { "type": "string", "format": "datetime" },
            "media": { "$ref": "#defs/mediaObject" }
          }
        }
      },
      "mediaObject": {
        "type": "object",
        "required": ["url", "mimeType"],
        "properties": {
          "url": { "type": "string", "description": "URL to the full media file (may be a signed URL)" },
          "mimeType": { "type": "string", "description": "MIME type of the media file" },
          "sizeBytes": { "type": "integer", "description": "File size in bytes" },
          "durationSeconds": { "type": "integer", "description": "Duration in seconds for audio/video" },
          "bitrateKbps": { "type": "integer", "description": "Bitrate in kilobits per second" }
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
| Ghost | Subscriber RSS | Map tiers to grant primitives (`access`, `limit`, `signal`), add discovery endpoint |
| Substack | Private feed tokens | Replace tokens with OPE OAuth flow |
| Daring Fireball-style | HTTP Basic Auth on feed URLs | Add discovery, upgrade to OAuth2 |
| Patreon | Per-tier RSS feeds | Map tiers to access levels in OPE metadata |
| Apple Podcasts Subscriptions | Platform-locked premium episodes | Add OPE metadata to RSS feed, expose discovery; OPE grants complement Apple's IAP entitlement |
| Spotify (premium podcasts) | Platform-exclusive gating | Publish OPE-enabled RSS alongside Spotify; portable grants unlock in any client |
| Supercast / Supporting Cast | Private RSS feed per subscriber | Replace per-subscriber feed URLs with OPE OAuth + grant tokens on a single feed |
| Acast+ / Wondery+ | Ad-free and bonus episodes | Map ad-free tier to `signal` grant (kind: `ad-free`); bonus content as `access` grants |
| YouTube / Nebula / Floatplane | Platform-gated video | Add OPE metadata to JSON Feed or Atom; serve video via signed media URLs in content endpoint |
| Bandcamp | Album/track purchase | Map purchases to `access` grants (scope: `item` or `collection`) scoped to album content_ids |
| Teachable / Podia / Kajabi | Course enrollment | Map enrollment to `access` grant (scope: `collection`) with sequential content_ids per lesson |

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

- Reference implementation: OPE Eleventy Demo (https://github.com/shellen/ope-eleventy-demo) — includes a publisher blog, gateway server, and reader app running locally in one command
- Reference gateway: OPE Gateway (included in demo)

Publisher reference architecture:

- Feed generator (existing RSS/Atom/JSON Feed output with OPE extensions)
- OPE discovery (static JSON at well-known endpoint)
- Entitlement service (OAuth2 + grant token issuance, refresh, revocation)
- Content API (authenticated content retrieval with batch support)

## 21. Grant Primitives

OPE defines three grant primitives. Every entitlement is expressed as one of these types with a small set of composable fields:

| Primitive | Meaning |
| --- | --- |
| `access` | Reader may view this content |
| `limit` | Reader may view up to a threshold |
| `signal` | Reader has a status that unlocks treatment |

### 21.1 Field Grammar

Every grant is expressed as a JSON object with the following fields:

| Field | Type | Applies to | Description |
| --- | --- | --- | --- |
| `type` | string | all | **Required.** One of `access`, `limit`, or `signal` |
| `scope` | string | access | Content scope: `all`, `item`, `collection`, or `pre-release` |
| `kind` | string | limit, signal | Qualifier for the limit or signal (e.g., `metered`, `locale-gated`, `patron`, `institutional`, `ad-free`, `group-member`) |
| `duration` | string | access | Time behavior: `perpetual`, `recurring`, `time-limited`, or `rental:Nh` (where N = hours) |
| `transferable` | boolean | access | Whether the grant can be shared to another user. Default `false` |
| `quota` | integer | limit | Number of items allowed in the period |
| `period` | string | limit | Reset cadence (e.g., `month`, `week`, `day`) |
| `source` | string | all | Origin of entitlement: `direct`, `broker`, `institution`, or `family-plan` |

Example grant object:

```json
{
  "type": "access",
  "scope": "all",
  "duration": "recurring",
  "source": "direct"
}
```

### 21.2 Named Grant Aliases

The following names are retained as friendly aliases for documentation, UI, and the grant builder. They are not load-bearing in the protocol — validators only need to check the three primitive types and their conditional fields.

| Name | type | scope / kind | duration | source | notes |
| --- | --- | --- | --- | --- | --- |
| Subscription | `access` | scope: `all` | `recurring` | `direct` | |
| Per-item | `access` | scope: `item` | `perpetual` | `direct` | |
| Gift | `access` | scope: `item` | `time-limited` | `direct` | `transferable: true` |
| Institutional | `signal` | kind: `institutional` | — | `institution` | |
| Metered | `limit` | kind: `metered` | — | `direct` | requires `quota` + `period` |
| Locale-free | `limit` | kind: `locale-gated` | — | `direct` | |
| Patronage | `signal` | kind: `patron` | — | `direct` | |
| Broker | `access` | scope: `collection` | `recurring` | `broker` | |
| Trial | `access` | scope: `all` | `time-limited` | `direct` | |
| Rental | `access` | scope: `item` | `rental:Nh` | `direct` | N = hours, e.g. `rental:72h` |
| Bundle | `access` | scope: `collection` | `perpetual` | `direct` | |
| Ad-supported | `signal` | kind: `ad-free` | — | `direct` | signals ad-free eligibility |
| Early access | `access` | scope: `pre-release` | `time-limited` | `direct` | |
| Family / Group | `signal` | kind: `group-member` | — | `family-plan` | |

### 21.3 Why Primitives

Fourteen named types created schema sprawl — each required its own validation path, documentation section, and client-side handler. Most differed by only one or two fields. Collapsing them to primitives means:

- Validators check `type`, then a small set of conditional fields
- New grant behaviors compose from existing fields rather than requiring new type definitions
- Publishers and brokers share one object shape across all entitlement scenarios
- The 14 friendly names remain usable in UI and docs without being load-bearing in the protocol

### 21.4 Payment Models (Informative)

OPE is compatible with multiple payment models. The grant primitive fields indicate how entitlement was obtained — OPE standardizes verification, not payment.

Compatible payment processors include Stripe, Paddle, Lemon Squeezy, PayPal, WooCommerce, Adyen, and self-hosted billing. Compatible payment protocols include x402, Stripe MPP, and any system that can trigger OPE grant issuance upon successful payment. Micropayment options include Lightning Network, Web Monetization (W3C WICG), and Nostr zaps.

## 22. Complete Worked Example

This non-normative section walks through the complete OPE flow from feed discovery to content display.

**Scenario:** Alice uses her favorite feed reader. She subscribes to a JSON Feed from The Cosmic Courier. One item in the feed is gated for subscribers. Alice has a subscription.

### Step 1: Alice adds the feed

The reader app fetches the JSON Feed:

```
GET https://publisher.example.com/feed.json
```

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "The Cosmic Courier",
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
          "grants_allowed": ["access"],
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

### Step 2: The reader discovers OPE support

The reader app detects the `ope` extension and fetches discovery:

```
GET https://publisher.example.com/.well-known/ope
```

```json
{
  "version": "0.1",
  "oauth_server": "https://publisher.example.com/.well-known/oauth-authorization-server",
  "entitlement": { "..." },
  "content": { "..." },
  "metadata": { "..." }
}
```

The reader app then fetches the OAuth server metadata per RFC 8414 to obtain authorization and token endpoints.

### Step 3: Alice taps the gated article

The reader app shows the preview text, word count (4,500 words), read time (18 min), and unlock CTA. Alice taps "Subscribe for $5/month."

The reader app initiates OAuth2 Authorization Code flow with PKCE:

```
GET https://publisher.example.com/oauth/authorize
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

The reader app exchanges the code for tokens:

```
POST https://publisher.example.com/oauth/token
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

### Step 5: The reader requests an entitlement grant

Using the OAuth access token, the reader app requests a grant (portable mode):

```
POST https://publisher.example.com/api/entitlement/grant
Authorization: Bearer <oauth_access_token>
```

```json
{
  "grant_token": "<jwt_grant_token>",
  "refresh_token": "refresh_abc",
  "expires_in": 3600,
  "grant": {
    "type": "access",
    "scope": "all",
    "duration": "recurring",
    "source": "direct"
  },
  "scope": ["content:read", "content:batch"]
}
```

The reader app stores the grant token and refresh token securely, associated with the publisher in its registry.

### Step 6: The reader retrieves the full article

```
GET https://publisher.example.com/api/content/post-789
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

Alice reads the full article right in her reader. Future gated articles from the publisher are automatically accessible until the grant token expires, at which point the reader app refreshes it silently.

### Worked Example: Podcast Episode

**Scenario:** Bob uses his favorite podcast player (any OPE-compatible player). He subscribes to the "Sound and Signal" podcast RSS feed. Most episodes are free with ads, but premium subscribers get ad-free episodes and bonus content.

#### Step 1: The player fetches the RSS feed

```
GET https://publisher.example.com/podcast/feed.xml
```

```xml
<rss version="2.0" xmlns:ope="https://feedspec.org/ope/ns/1.0">
  <channel>
    <title>Sound and Signal</title>
    <item>
      <title>Episode 41: RSS at 25</title>
      <enclosure url="https://publisher.example.com/podcast/ep41.mp3" type="audio/mpeg" length="41000000"/>
      <description>A look back at 25 years of RSS...</description>
    </item>
    <item>
      <title>Episode 42: The Future of Open Podcasting (Premium)</title>
      <enclosure url="https://publisher.example.com/podcast/ep42-preview.mp3" type="audio/mpeg" length="2400000"/>
      <description>Preview: A 2-minute clip from our conversation...</description>
      <ope:access level="subscriber">
        <ope:content-id>episode-42</ope:content-id>
        <ope:metadata>
          <ope:resource-type>podcast_episode</ope:resource-type>
          <ope:duration-seconds>3420</ope:duration-seconds>
          <ope:media-type>audio/mpeg</ope:media-type>
          <ope:series-title>Sound and Signal</ope:series-title>
          <ope:episode-number>42</ope:episode-number>
          <ope:season-number>3</ope:season-number>
          <ope:unlock-cta>Subscribe for $3/month for ad-free and bonus episodes</ope:unlock-cta>
          <ope:unlock-url>https://publisher.example.com/podcast/subscribe?ope_unlock=1</ope:unlock-url>
        </ope:metadata>
      </ope:access>
    </item>
  </channel>
</rss>
```

The podcast player plays Episode 41 normally (it's free). For Episode 42, it detects the `ope:access` element and shows the 2-minute preview clip with the unlock CTA.

#### Step 2: Bob subscribes

Bob taps "Subscribe for $3/month." The podcast player initiates the OPE OAuth flow (same as Steps 2-5 in the article example above). After authentication and payment, Bob receives a grant token with an `access` grant (scope: `all`, duration: `recurring`).

#### Step 3: The player retrieves the full episode

```
GET https://publisher.example.com/api/content/episode-42
Authorization: Bearer <jwt_grant_token>
```

```json
{
  "id": "episode-42",
  "title": "Interview: The Future of Open Podcasting",
  "resource_type": "podcast_episode",
  "published": "2026-03-10T00:00:00Z",
  "media": {
    "url": "https://publisher.example.com/podcast/ep42-full-adfree.mp3?sig=<signed_token>&exp=1710003600",
    "mime_type": "audio/mpeg",
    "size_bytes": 54800000,
    "duration_seconds": 3420
  },
  "content_html": "<p><strong>Show notes:</strong> In this episode, Jason talks with...</p>"
}
```

The podcast player downloads the full ad-free episode from the signed media URL and plays it. The signed URL expires alongside the grant token, preventing URL sharing. Future premium episodes are automatically accessible until the grant refreshes.

## 23. Why OPE Matters

Historically, publishing stacks combine content, payments, and distribution into monolithic platforms. When a reader subscribes to a Substack newsletter, that subscription is locked to the Substack ecosystem. When a listener pays for a premium podcast on Apple Podcasts, that access doesn't transfer to their preferred podcast player. When a publisher leaves Substack, subscribers don't follow automatically.

OPE separates these layers so that:

- **Subscriptions are portable:** a user's entitlement works in any OPE-compatible client — feed reader, podcast player, video app, or browser.
- **Users choose their tools:** any compatible app can present gated content, not just the publisher's website or a platform's proprietary player.
- **Publishers retain control:** entitlement issuance and content delivery remain with the publisher.
- **Media types are equal:** articles, podcasts, video, music, and courses all use the same entitlement layer — no per-format silos.
- **New models emerge:** brokers can create subscription bundles; gift links work cross-platform; institutional access standardizes; ad-free tiers and trials compose naturally.
- **Agents can participate:** OPE grant tokens work for machine clients as naturally as human ones, complementing agentic payment protocols.

## 24. Future Work

- Reference gateway implementation (open-source OPE container for publishers).
- Reference broker implementation demonstrating multi-publisher bundles and browser-based cross-publisher unlock.
- Browser extension reference implementation demonstrating HTTP 402 detection, OPE header parsing, and cookie-based unlock.
- Reference podcast gateway demonstrating OPE-enabled RSS feed with gated episodes and signed media URL delivery.
- Formal alignment with ATProto permission spaces as the system reaches specification stage.
- Standardized client-to-client entitlement portability (transferring an active subscription between client apps without re-authentication).
- Content format negotiation (request markdown vs. HTML vs. structured blocks vs. media quality/bitrate).
- Adaptive streaming support: formalize HLS and DASH manifest delivery through the content endpoint for video and live audio.
- Offline media access: standardize how clients cache entitled media files for offline playback within grant token validity windows.
- Integration with ActivityPub for cross-protocol entitlement verification.
- Integration with Podcasting 2.0 namespace (`podcast:`) for compatibility with modern podcast feed extensions.
- Publisher analytics extensions (anonymized consumption metrics returned to publisher without tracking individual users).
- Agent-to-agent entitlement flows, where OPE grants serve as capability attestations in A2A communication.
- Metered access analytics: standardized mechanism for publishers to track `meter_remaining` decrements across API and browser contexts.
- DRM-free media protection: explore signed URL best practices and time-limited download tokens as an alternative to traditional DRM for entitled media.

## Acknowledgments

Thanks to [Max Engel](https://github.com/maxengel) for feedback on OAuth discovery alignment, token architecture, revocation enforcement, and the reference gateway concept. Thanks to the ATProto team, particularly [Daniel Holmgren](https://dholms.leaflet.pub/3mhj6bcqats2o), for the permission spaces design that informs Section 15.

---

## Author

Jason Shellen
https://shellen.com
ATProto / Bluesky: @shellen.com
