# OPE Feeds Profile: Batch Retrieval

> **Status: informative, outside the core.**
>
> OPE v0.2 withdraws batch retrieval from the core (Part II, Feeds profile). A Resource
> Server MAY offer a batch endpoint; if it does, it MUST return partial results with a
> per-item `status`. That is the only requirement. This file records the v0.1 design the
> requirement came from, for implementers who want a starting point.

## Requirement (v0.2)

The Feeds profile states the whole requirement: a Resource Server that offers a batch
endpoint MUST return partial results with a per-item `status`. The endpoint path, request shape, `status` values, and maximum
batch size are the Resource Server's own.

Note (informative): each Asset in a batch is still a request for a gated Asset, so the
checks in v0.2 §11.2 apply to each one.

## v0.1 design (historical)

The text below is §10.2 of the v0.1 draft (2026-03-27), verbatim. It uses v0.1 vocabulary:
"Reader" is now Client, "grant token" is now License Token, `Authorization: Bearer` is now
`DPoP` or `License` (v0.2 §11.1), and `content_ids` are now Asset identifiers (v0.2 §5).
The "manifest" it mentions was withdrawn in v0.2.


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

