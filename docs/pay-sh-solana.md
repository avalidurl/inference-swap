# pay.sh Solana buyer path for CURB

**pay.sh** (`pay` CLI, https://pay.sh) is a **buyer-side** discovery/payment client for HTTP 402 (x402 / MPP). It is **not** a seller acceptor. CURB settles via seller-side **x402 `accepts[]`** (Base + Solana SPL USDC, CDP facilitator).

## Install / build

```bash
brew install pay          # → /opt/homebrew/bin/pay  (currently 0.21.0)
# or: npx @solana/pay …
pay --version
pay setup                 # keypair → macOS Keychain + Touch ID
pay account list
pay topup                 # USDC/USDT/CASH; facilitator sponsors Solana fees
```

MCP for agents:

```json
{ "mcpServers": { "pay": { "command": "pay", "args": ["mcp"] } } }
```

Developer gateway (optional, separate from CURB): `pay server start <spec.yml>` + listing in [solana-foundation/pay-skills](https://github.com/solana-foundation/pay-skills). CURB does **not** run behind `pay server` — agents call `https://curb.numetal.xyz` directly.

## Buyer commands (Solana)

```bash
# Discover
pay fetch https://curb.numetal.xyz/.well-known/x402
pay fetch https://curb.numetal.xyz/openapi.json
pay fetch https://curb.numetal.xyz/v1/offers

# Catalog probe — bare POST always 402 with Base + Solana dual-payee accepts
pay curl -X POST https://curb.numetal.xyz/v1/pay

# Full swap
pay curl -X POST https://curb.numetal.xyz/v1/intents \
  -H 'content-type: application/json' \
  -d '{"model":"MODEL","mtok":1,"maxPriceUsd":0.5,"buyer":"<solana-or-evm>"}'
# → match.id
pay curl -X POST https://curb.numetal.xyz/v1/matches/<match.id>/pay
```

There is no `pay discover` subcommand.

## Seller notes

- Offers need Base `sellerPayTo` (`0x…`). Optional `sellerSolPayTo` (base58) adds Solana seller accepts so buyers can settle the full dual-payee split on Solana.
- Hub Solana fee recipient: `HUB_PAY_TO_SOLANA` (see `wrangler.toml`).
- Worker holds **no** Solana private key; CDP `feePayer` sponsors tx fees.

## pay-skills listing (optional PR)

Draft under `providers/numetal/curb/PAY.md` pointing `openapi.url` at `https://curb.numetal.xyz/openapi.json`, then:

```bash
pay catalog check providers/numetal/curb/PAY.md -v
```
