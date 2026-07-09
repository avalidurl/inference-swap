/**
 * CURB — on-chain fee distribution glue (0xSplits PushSplit V2.2 on Base).
 *
 * The buyer pays the GROSS once to the split (single-payee x402). This module fans that gross out
 * on-chain to the recipients (seller 95% + hub 5%) by calling the split's `distribute()`.
 *
 * Proven end-to-end on Base mainnet (2026-07-09):
 *   split deploy  0x25f17c0a69a108d0280b6b2d6804909e83d8436d6abaa5596516fa91aafc0163
 *   x402 settle   0xdd2ad482383c2b6337b21ac42e7f119f6a244274312b9927699fed54cd005768  (verified:true)
 *   distribute    0x748a6470cbce79a02bce4663711b4881f8e593dd1cc71f3ba8d26322a5d387e3
 *     → seller 0x8f49… +113999 (95.0006%) · hub 0x3eee… +5999 (4.999%) USDC, direct on-chain.
 *
 * distribute() is PERMISSIONLESS on a 0xSplits push split: any caller can trigger the fan-out and
 * the `distributor` arg only earns the (here 0) distribution incentive. The recipient set and the
 * 95/5 allocation are fixed by the immutable split, so who signs the tx cannot change where the
 * funds land — the fee is enforced by the contract, not by trust in the keeper.
 *
 * SIGNING (keeper): env.KEEPER_ADDRESS submits distribute() via the Privy server-wallet REST API —
 *   POST https://api.privy.io/v1/wallets/{PRIVY_KEEPER_WALLET_ID}/rpc
 *   body { method:"eth_sendTransaction", caip2:"eip155:8453", chain_type:"ethereum",
 *          params:{ transaction:{ to:<split>, data:<distribute calldata>, value:"0x0" } } }
 *   auth: HTTP Basic PRIVY_APP_ID:PRIVY_APP_SECRET + header `privy-app-id`.
 *   PREFERRED / DEFAULT: an APP-OWNED Privy server wallet (no user owner) — the Worker signs with
 *   app auth alone, no extra header. FALLBACK: if the keeper wallet is owned by a key-quorum
 *   (owner_id set), the request ALSO needs a `privy-authorization-signature` header signed with the
 *   owner's authorization key; supply it as the secret PRIVY_AUTHORIZATION_SIGNATURE (sent verbatim).
 *
 * All Privy responses are treated as untrusted: we only accept a 2xx + a 0x-prefixed hash string.
 *
 * Required Worker config to make auto-distribute live:
 *   vars    : KEEPER_ADDRESS, PRIVY_KEEPER_WALLET_ID, KEEPER_DISTRIBUTE="on", (BASE_RPC_URL optional)
 *   secrets : PRIVY_APP_ID, PRIVY_APP_SECRET, [PRIVY_AUTHORIZATION_SIGNATURE if keeper is quorum-owned]
 *   binding : SWAP KV (idempotency lock `keeper:lock`, ~120s TTL, so overlapping crons/manual runs
 *             never double-submit distribute()).
 */

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_CAIP2 = "eip155:8453";
const DEFAULT_RPC = "https://mainnet.base.org";
// distribute((address[],uint256[],uint256,uint16),address,address)
const DISTRIBUTE_SELECTOR = "2d3f5537";
// balanceOf(address)
const BALANCEOF_SELECTOR = "70a08231";

function word(n) {
  return BigInt(n).toString(16).padStart(64, "0");
}
function addrWord(a) {
  return String(a || "").toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/** Parse SPLIT_RECIPIENTS_BASE ("addr:allocation,addr:allocation") → {recipients, allocations, total}. */
export function parseSplitRecipients(env) {
  const raw = String(env.SPLIT_RECIPIENTS_BASE || "").trim();
  const recipients = [];
  const allocations = [];
  let total = 0n;
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [addr, alloc] = part.split(":").map((s) => s.trim());
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr || "")) continue;
    const a = BigInt(alloc || "0");
    recipients.push(addr);
    allocations.push(a);
    total += a;
  }
  return { recipients, allocations, total };
}

/**
 * ABI-encode distribute((address[],uint256[],uint256,uint16),address,address). Hand-rolled (no
 * web3 dep in the Worker); verified byte-for-byte against `cast calldata` for the CURB split.
 */
export function encodeDistributeCalldata({ recipients, allocations, totalAllocation, incentive = 0, token, distributor }) {
  const n = recipients.length;
  if (n === 0 || n !== allocations.length) throw new Error("bad_split_recipients");
  // outer head: [offset→splitTuple = 0x60][token][distributor]
  const head = word(0x60) + addrWord(token) + addrWord(distributor);
  // splitTuple head: [offset→recipients][offset→allocations][totalAllocation][distributionIncentive]
  const recipOffset = 0x80; // 4 words
  const allocOffset = recipOffset + (1 + n) * 32;
  let tuple = word(recipOffset) + word(allocOffset) + word(totalAllocation) + word(incentive);
  tuple += word(n) + recipients.map(addrWord).join("");
  tuple += word(n) + allocations.map((x) => word(x)).join("");
  return "0x" + DISTRIBUTE_SELECTOR + head + tuple;
}

/** Build the distribute tx {to, data} for the CURB split on Base. */
export function buildDistributeTx(env) {
  const split = String(env.SPLIT_ADDRESS_BASE || "").trim();
  const token = String(env.USDC || USDC_BASE).trim();
  const distributor = String(env.KEEPER_ADDRESS || "").trim() || split;
  const { recipients, allocations, total } = parseSplitRecipients(env);
  if (!/^0x[a-fA-F0-9]{40}$/.test(split)) throw new Error("split_address_missing");
  const data = encodeDistributeCalldata({
    recipients,
    allocations,
    totalAllocation: total,
    incentive: 0,
    token,
    distributor,
  });
  return { to: split, data };
}

/** Read the split's USDC balance (raw 6dp) via a Base JSON-RPC eth_call. Fail-soft → null. */
export async function getSplitUsdcBalance(env) {
  try {
    const rpc = String(env.BASE_RPC_URL || DEFAULT_RPC);
    const split = String(env.SPLIT_ADDRESS_BASE || "").trim();
    const token = String(env.USDC || USDC_BASE).trim();
    const data = "0x" + BALANCEOF_SELECTOR + addrWord(split);
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: token, data }, "latest"] }),
    });
    const j = await res.json();
    if (!j?.result || j.result === "0x") return null;
    return BigInt(j.result);
  } catch {
    return null;
  }
}

/**
 * Submit distribute() from the keeper via the Privy server-wallet REST API. Returns
 * { ok, hash?, txId?, error? }. Never throws (fail-soft for cron use).
 */
export async function distributeViaKeeper(env) {
  const appId = String(env.PRIVY_APP_ID || "").trim();
  const appSecret = String(env.PRIVY_APP_SECRET || "").trim();
  const walletId = String(env.PRIVY_KEEPER_WALLET_ID || "").trim();
  if (!appId || !appSecret) return { ok: false, error: "privy_creds_missing" };
  if (!walletId) return { ok: false, error: "keeper_wallet_id_missing" };

  let tx;
  try {
    tx = buildDistributeTx(env);
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }

  const headers = {
    authorization: "Basic " + btoa(`${appId}:${appSecret}`),
    "privy-app-id": appId,
    "content-type": "application/json",
  };
  // Optional owner authorization signature for quorum-owned keeper wallets.
  const authSig = String(env.PRIVY_AUTHORIZATION_SIGNATURE || "").trim();
  if (authSig) headers["privy-authorization-signature"] = authSig;

  try {
    const res = await fetch(`https://api.privy.io/v1/wallets/${walletId}/rpc`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        method: "eth_sendTransaction",
        caip2: BASE_CAIP2,
        chain_type: "ethereum",
        params: { transaction: { to: tx.to, data: tx.data, value: "0x0" } },
      }),
    });
    const j = await res.json().catch(() => ({}));
    // Untrusted response: accept ONLY a 2xx + a well-formed 0x tx hash.
    const hash = j?.data?.hash;
    if (!res.ok || typeof hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      const err = typeof j?.error === "string" ? j.error : typeof j?.message === "string" ? j.message : `privy_${res.status}`;
      return { ok: false, error: err };
    }
    const txId = typeof j?.data?.transaction_id === "string" ? j.data.transaction_id : undefined;
    return { ok: true, hash, txId };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/** True when the app-owned Privy signer secrets needed to sign distribute() are all present. */
export function keeperSignerReady(env) {
  return (
    !!String(env.PRIVY_APP_ID || "").trim() &&
    !!String(env.PRIVY_APP_SECRET || "").trim() &&
    !!String(env.PRIVY_KEEPER_WALLET_ID || "").trim()
  );
}

/**
 * Best-effort idempotency lock in SWAP KV so overlapping crons / a manual run never double-submit
 * distribute(). KV has no atomic CAS, but a get-then-put with a short TTL is sufficient here (single
 * keeper, low frequency): the lock is left to expire naturally so a second invocation within the
 * window is refused. Returns true if we acquired it. Fail-open on KV errors is intentionally NOT
 * done — if KV is unavailable we refuse to submit (return false) rather than risk a double-send.
 */
async function acquireKeeperLock(env, ttlSec = 120) {
  try {
    if (!env.SWAP) return false;
    const existing = await env.SWAP.get("keeper:lock");
    if (existing) return false;
    await env.SWAP.put("keeper:lock", new Date().toISOString(), { expirationTtl: ttlSec });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gated auto-distribute for the scheduled() cron. Fail-soft: never throws, and logs the failure
 * marker `curb_distribute_cron` on any unexpected error. No-op unless ALL of:
 *   1. KEEPER_DISTRIBUTE === "on",
 *   2. the app-owned Privy signer secrets are present (keeperSignerReady),
 *   3. the split holds at least KEEPER_DISTRIBUTE_MIN USDC (raw 6dp, default 10000 = $0.01),
 *   4. we win the SWAP KV `keeper:lock` (idempotency — overlapping runs won't double-submit).
 */
export async function maybeAutoDistribute(env) {
  try {
    if (String(env.KEEPER_DISTRIBUTE || "").toLowerCase() !== "on") {
      return { ran: false, reason: "disabled" };
    }
    if (!keeperSignerReady(env)) {
      return { ran: false, reason: "signer_secrets_missing" };
    }
    const min = BigInt(String(env.KEEPER_DISTRIBUTE_MIN || "10000"));
    const bal = await getSplitUsdcBalance(env);
    if (bal == null) return { ran: false, reason: "balance_unknown" };
    if (bal < min) return { ran: false, reason: "below_threshold", balance: bal.toString() };

    // Take the lock only once we actually intend to submit; leave it to expire so a near-simultaneous
    // second invocation is refused for the TTL window.
    const locked = await acquireKeeperLock(env);
    if (!locked) return { ran: false, reason: "locked", balance: bal.toString() };

    const r = await distributeViaKeeper(env);
    if (!r.ok) console.error("curb_distribute_failed", { error: r.error, balance: bal.toString() });
    else console.log("curb_distribute_ok", { hash: r.hash, balance: bal.toString() });
    return { ran: r.ok, ...r, balance: bal.toString() };
  } catch (err) {
    console.error("curb_distribute_cron", String(err?.message || err));
    return { ran: false, reason: "error", error: String(err?.message || err) };
  }
}
