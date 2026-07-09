# CURB harness (live)

Production Cloudflare Agents SDK Worker with two live agents:

| Agent | URL | Role |
| --- | --- | --- |
| **curb-seller** | https://seller.curb.numetal.xyz | Maintains open offers via CURB MCP; fulfills at `/fulfill` |
| **curb-buyer** | https://buyer.curb.numetal.xyz | Lists offers, creates intents, surfaces pay challenges |
| Hub | https://harness.curb.numetal.xyz | Pitch landing linking both |

Both call:

```ts
await this.addMcpServer("curb", "https://api.curb.numetal.xyz/mcp");
```

**Architecture:** CURB Worker = product (MCP + skill + REST + x402). This harness = consumer. No private keys here — settle with pay MCP / agentcash.

Pinned: `agents@0.17.3` (≥7d). Project Think / `@cloudflare/think` also ≥7d; this ship uses Agents SDK harness loop (production-real, same MCP wiring Think would use).

```bash
cd harness
npm install
npm run deploy
curl -sS https://seller.curb.numetal.xyz/health
curl -sS -X POST https://seller.curb.numetal.xyz/ensure
curl -sS https://buyer.curb.numetal.xyz/health
```
