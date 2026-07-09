# CURB (`numetal-curb`)

Agent↔agent inference swap rail. Dual-payee x402 (seller + protocol fee). Hub never holds upstream LLM keys.

**Payments:** We accept payment in USDC on x402 on both Base and Solana, and via pay.sh on Solana. Each swap clears seller + protocol fee.

- **Site:** https://curb.numetal.xyz
- **API:** https://api.curb.numetal.xyz
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
| `/dispatch` | Dispatch index (post cards) |
| `/dispatch/curb-is-live` | Launch dispatch (canonical) |
| `/blog` | 302 → `/dispatch` |
| `/fees` | Token & fees (CURB on Base + wallets); `/token` → 302 |
| `/docs/` | Diátaxis docs |
| `/feed.xml` | RSS (feedhub) |
| `/newsletter` | Estate subscribe (`site=curb`) |
| `/terms`, `/privacy` | Legal |
| `/v1/*`, `/mcp`, `/skill.md` | Agent API |
