# CURB (`numetal-curb`)

Agent↔agent inference swap rail. Single-payee x402 (buyer pays gross once to an on-chain 0xSplits split; seller + protocol fee split on-chain). Hub never holds upstream LLM keys.

**Settlement:** x402 USDC on Base (`eip155:8453`). CURB splits seller + protocol fee on-chain via a 0xSplits split.

- **Site:** https://curb.numetal.xyz
- **API:** https://api.curb.numetal.xyz
- **Repo:** private `gokhan-vc/inference-swap` (Worker name remains `inference-swap`)
- **Docs:** `/docs/` (Vocs Diátaxis)
- **Contact:** contact@gokhan.vc

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

## Keeper auto-distribute (on-chain fee fan-out)

Buyers pay the **gross** once to the immutable 0xSplits split (single-payee x402). A permissionless
`distribute()` fans it out on-chain to **seller 95% / hub 5%**. The split fixes that allocation — **who
signs `distribute()` cannot change where funds land; the keeper only pays gas.** A gated cron
(`src/distribute.js` → `maybeAutoDistribute`, already wired from `scheduled()` in `src/index.js`)
submits it whenever the split holds ≥ `KEEPER_DISTRIBUTE_MIN` USDC, guarded by a `SWAP`-KV lock
(`keeper:lock`, ~120s TTL) so overlapping runs never double-submit. It is a hard no-op until go-live.

### Founder go-live — exactly one step

**Recommended (app-owned Privy server wallet — the Worker signs itself):**

1. Provision an **app-owned** Privy EVM server wallet (**no user owner / no key-quorum**) on Base.
   Set `KEEPER_ADDRESS` (its `0x` address) and `PRIVY_KEEPER_WALLET_ID` (its wallet id) in
   `wrangler.toml`, then set the app credentials as secrets and fund it with a little Base ETH for gas:

   ```bash
   wrangler secret put PRIVY_APP_ID
   wrangler secret put PRIVY_APP_SECRET
   ```

2. Set `KEEPER_DISTRIBUTE = "on"` in `wrangler.toml` and deploy. That's it — the cron takes over.

**Alternative (keep the existing quorum-owned keeper wallet):** register a Privy authorization key on
the wallet's key-quorum and `wrangler secret put PRIVY_AUTHORIZATION_SIGNATURE` (sent verbatim as the
`privy-authorization-signature` header). App-owned is preferred because the Worker needs no per-tx
signature.

`BASE_RPC_URL` (var, optional) overrides the balance-read RPC; it defaults to `https://mainnet.base.org`.
All Privy responses are treated as untrusted (only a 2xx + a well-formed `0x…` tx hash is accepted).

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
