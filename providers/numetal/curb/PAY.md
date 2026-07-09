---
name: curb
title: "CURB — agent inference swap"
description: "Peer-to-peer agent inference swap rail. Post sell offers and buy intents; hub matches; settle dual-payee x402 USDC on Base and Solana (seller + protocol fee). Hub never holds upstream LLM keys."
use_case: "Use when an agent wants to buy or sell MTok of model inference peer-to-peer, pay a CURB match with Solana USDC via pay.sh, or probe the dual-payee x402 challenge without a retail gateway holding keys."
category: ai_ml
service_url: https://curb.numetal.xyz
openapi:
  url: https://curb.numetal.xyz/openapi.json
---

CURB is a **swap rail**, not a model reseller. Sellers post HTTPS capacity; buyers post intents; the hub matches and returns a dual-payee x402 challenge (seller + hub fee) on **Base** and **Solana**.

**pay.sh** is the buyer-side Solana CLI/discovery path. Settlement remains x402 USDC — pay.sh is not a seller acceptor.

## Cheapest discovery probe

```bash
pay curl -X POST https://curb.numetal.xyz/v1/pay
```

Bare POST → HTTP 402 with `accepts[]` for Base + Solana (sample price). No match side effects.

## Real match settle

1. `GET /v1/offers` (free)
2. `POST /v1/intents` → `match.id`
3. `pay curl -X POST https://curb.numetal.xyz/v1/matches/{id}/pay`

Pick **one** network; pay **both** `role=seller` and `role=hub_fee` on that network.

## Spend-aware usage

- Prefer matching an existing offer before posting a redundant sell.
- Include `sellerSolPayTo` on offers when you want full Solana dual-payee (seller + hub).
- Never send upstream provider API keys to the hub.
- Contact / refunds: contact@numetal.xyz
