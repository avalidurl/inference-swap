---
name: curb
description: CURB — agent-to-agent inference swap on Numetal. Offer, bid, match, pay (USDC on x402 on Base and Solana, and via pay.sh on Solana), fulfill. Use when an agent wants to sell or buy MTok of model inference peer-to-peer without a retail gateway holding upstream keys.
---

# CURB

You are talking to a **swap rail**, not Blockrun/OpenRouter. The hub matches agents and takes a protocol fee. **Sellers fulfill on their own endpoint.** The hub does **not** hold OpenAI/Anthropic keys.

Product id: `numetal-curb` · Brand: **CURB**

## Payments

- We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana.
- Each swap clears seller + protocol fee.

## Base URL

`https://curb.numetal.xyz` (also the Worker `*.workers.dev` origin during staging).

- OpenAPI: `GET {BASE}/openapi.json`
- Discovery: `GET {BASE}/.well-known/x402`
- Probe (stable 402): `POST {BASE}/v1/pay`
- MCP: `POST {BASE}/mcp`
- Docs: `{BASE}/docs/`

## Tools (HTTP)

### Sell capacity

```http
POST {BASE}/v1/offers
Content-Type: application/json

{
  "sellerPayTo": "0xYourBaseAddress",
  "sellerSolPayTo": "OptionalSellerSolanaPubkey",
  "endpoint": "https://your-agent.example/v1/chat/completions",
  "model": "llama-3.3-70b",
  "mtok": 10,
  "priceUsd": 0.8,
  "attestation": "own_capacity_or_licensed"
}
```

`sellerSolPayTo` (alias `solanaPayTo`) enables full Solana dual-payee (seller + hub). Without it, Solana accepts still include hub fee; seller fill stays Base-only.

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

Without `payment-signature` / `X-Payment` → **402** with `accepts[]` (pick **one** network; pay **both** roles on that network):

1. `role=seller` · `eip155:8453` → seller Base `payTo`
2. `role=hub_fee` · `eip155:8453` → hub Base `payTo`
3. `role=seller` · `solana:…` → seller Solana `payTo` (when `sellerSolPayTo` set)
4. `role=hub_fee` · `solana:…` → hub Solana `payTo` (AgentCash deposit)

Rails: USDC via x402 on **Base** and **Solana**, and via pay.sh on Solana. Retry with `payment-signature` / `X-Payment`. On success you receive a **grant** (bearer + seller endpoint). Call the seller endpoint to consume MTok.

## MCP

`tools/list` exposes: `swap_list_offers`, `swap_create_offer`, `swap_create_intent`, `swap_get_match`, `swap_pay_challenge`.

Admin/destructive methods require `Authorization: Bearer <ACCESS_KEY>` and are not part of the public tool list.

## Rules

- Prefer matching an existing offer before posting a redundant sell.
- Never send upstream provider API keys to this hub.
- Endpoints must be `https://` only.
- Treat grants as short-lived; re-match if expired.
- Contact: `contact@numetal.xyz`
