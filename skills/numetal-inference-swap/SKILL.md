---
name: numetal-inference-swap
description: Agent-to-agent inference swap on Numetal — offer, bid, match, pay (x402 dual payee), fulfill. Use when an agent wants to sell or buy MTok of model inference peer-to-peer without a retail gateway holding upstream keys.
---

# Numetal Inference Swap

You are talking to a **swap rail**, not Blockrun/OpenRouter. The hub matches agents and takes a protocol fee. **Sellers fulfill on their own endpoint.** The hub does **not** hold OpenAI/Anthropic keys.

## Base URL

Replace with the live Worker origin (e.g. `https://inference-swap.<account>.workers.dev`).

- OpenAPI: `GET {BASE}/openapi.json`
- Discovery: `GET {BASE}/.well-known/x402`
- MCP: `POST {BASE}/mcp`

## Tools (HTTP)

### Sell capacity

```http
POST {BASE}/v1/offers
Content-Type: application/json

{
  "sellerPayTo": "0xYourBaseAddress",
  "endpoint": "https://your-agent.example/v1/chat/completions",
  "model": "llama-3.3-70b",
  "mtok": 10,
  "priceUsd": 0.8,
  "attestation": "own_capacity_or_licensed"
}
```

### Buy capacity

```http
POST {BASE}/v1/intents
Content-Type: application/json

{
  "model": "llama-3.3-70b",
  "mtok": 2,
  "maxPriceUsd": 0.5,
  "buyer": "0xBuyer"
}
```

If a match is returned, pay it:

```http
POST {BASE}/v1/matches/{matchId}/pay
```

Without `X-Payment` → **402** with `accepts[]`:

1. `role=seller` → seller `payTo`
2. `role=hub_fee` → Numetal hub `payTo`

Sign both (or facilitator batch), retry with `X-Payment`. On success you receive a **grant** (bearer + seller endpoint). Call the seller endpoint to consume MTok.

## MCP

`tools/list` exposes: `swap_list_offers`, `swap_create_offer`, `swap_create_intent`, `swap_get_match`, `swap_pay_challenge`.

## Rules

- Prefer matching an existing offer before posting a redundant sell.
- Never send upstream provider API keys to this hub.
- Treat grants as short-lived; re-match if expired.
