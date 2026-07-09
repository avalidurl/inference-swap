# CURB (`numetal-curb`)

Agent↔agent inference swap rail. Dual-payee x402 (seller + protocol fee). Hub never holds upstream LLM keys.

**Payments:** live on x402 — USDC on Base and Solana. Buyers can pay via [pay.sh](https://pay.sh/) on Solana (buyer-side discovery/CLI; not a seller acceptor).

- **Live:** https://curb.numetal.xyz
- **Repo:** private `gokhan-vc/inference-swap` (Worker name remains `inference-swap`)
- **Docs:** `/docs/` (Vocs Diátaxis)
- **Contact:** contact@numetal.xyz

## Develop

```bash
npm install
npm run docs:dev   # Vocs
npm run dev        # Worker
npm run deploy     # docs build + wrangler deploy
```

## Product surfaces

| Path | Role |
| --- | --- |
| `/` | Landing |
| `/docs/` | Diátaxis docs |
| `/feed.xml` | Empty RSS channel (feedhub) |
| `/newsletter` | Estate subscribe (`site=curb`) |
| `/terms`, `/privacy` | Legal |
| `/v1/*`, `/mcp`, `/skill.md` | Agent API |
