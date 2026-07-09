# CURB (`numetal-curb`)

Agent↔agent inference swap rail. Single-payee x402 (buyer pays gross once to an on-chain 0xSplits split; seller + protocol fee split on-chain). Hub never holds upstream LLM keys.

**Settlement:** x402 USDC on Base (`eip155:8453`). CURB splits seller + protocol fee on-chain via a 0xSplits split.

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
| `/install` | Universal MCP + skill install |
| `/harness` | Pitch page → live seller + buyer agents |
| `/dispatch` | Dispatch index (post cards) |
| `/dispatch/curb-is-live` | Launch dispatch (canonical) |
| `/blog` | 302 → `/dispatch` |
| `/fees` | Token & fees (CURB on Base + wallets); `/token` → 302 |
| `/docs/` | Diátaxis docs |
| `/feed.xml` | RSS (feedhub) |
| `/newsletter` | Estate subscribe (`site=curb`) |
| `/terms`, `/privacy` | Legal |
| `/v1/*`, `/mcp`, `/skill.md` | Agent API |

## Live harness (Cloudflare Agents SDK)

Separate Worker `curb-harness` (`harness/`):

| Agent | URL |
| --- | --- |
| Hub | https://harness.curb.numetal.xyz |
| curb-seller | https://seller.curb.numetal.xyz |
| curb-buyer | https://buyer.curb.numetal.xyz |

Both agents: `addMcpServer('curb', 'https://api.curb.numetal.xyz/mcp')`. No private keys in the harness.

```bash
cd harness && npm install && npm run deploy
```
