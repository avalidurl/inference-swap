#!/usr/bin/env node
/**
 * CURB launch dispatch — email (Resend) + XMTP fan-out via feedhub estate.
 * Usage: ADMIN_TOKEN=... node scripts/send-curb-launch.mjs
 * Prefer: poll CURB feed first so origin_feed=curb, then blast with origin_feed=curb.
 */
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const FEEDHUB = process.env.FEEDHUB_URL || "https://api.gokhan.vc";
const XMTP_BOT = process.env.XMTP_BOT_URL || "https://xmtp-bot.gokhan.vc";

const CANONICAL = "https://curb.numetal.xyz/dispatch/curb-is-live";
const TITLE = "CURB is live";
const SUBJECT = "CURB is live";
const PARA1 =
  "CURB is an agent↔agent inference swap. Agents buy and sell inference from each other; the hub clears the trade — no upstream LLM keys on our side.";
const PARA2 =
  "Live now at curb.numetal.xyz. Pay in USDC on x402 on Base and Solana, and via pay.sh on Solana. $CURB is on Base (0xf0CBbf0806eD88910a011eEc9439A990c8C24BA3) — Bankr launch is linked from the site.";
const SUMMARY = `${PARA1} ${PARA2}`;
const HTML = `<p>${PARA1}</p><p>${PARA2}</p><p><a href="${CANONICAL}">curb.numetal.xyz/dispatch/curb-is-live</a></p><p style="color:#666;font-size:14px">First published on <a href="${CANONICAL}">CURB</a>.</p>`;

if (!ADMIN_TOKEN) {
  console.error("ADMIN_TOKEN required");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${ADMIN_TOKEN}`, "content-type": "application/json" };

async function main() {
  const status = await fetch(`${FEEDHUB}/admin/status`, { headers: auth });
  if (!status.ok) throw new Error(`admin/status ${status.status}`);
  const st = await status.json();
  console.log("subscribers:", JSON.stringify(st.subscribers));

  const poll = await fetch(`${FEEDHUB}/admin/poll`, { method: "POST", headers: auth });
  const pollBody = await poll.json().catch(() => ({}));
  if (!poll.ok) throw new Error(`admin/poll failed: ${JSON.stringify(pollBody)}`);
  console.log("poll:", pollBody);

  const email = await fetch(`${FEEDHUB}/admin/dispatch-blast`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      canonical_url: CANONICAL,
      title: SUBJECT,
      summary: SUMMARY,
      html: HTML,
      origin_feed: "curb",
    }),
  });
  const emailBody = await email.json();
  if (!email.ok) throw new Error(`dispatch-blast failed: ${JSON.stringify(emailBody)}`);
  console.log("email broadcast:", JSON.stringify(emailBody));

  const xmtp = await fetch(`${XMTP_BOT}/fanout`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      canonical_url: CANONICAL,
      url: CANONICAL,
      title: TITLE,
      excerpt: SUMMARY,
    }),
  });
  const xmtpBody = await xmtp.json().catch(() => ({}));
  if (!xmtp.ok) throw new Error(`xmtp fanout failed: ${xmtp.status} ${JSON.stringify(xmtpBody)}`);
  console.log("xmtp fanout:", JSON.stringify(xmtpBody));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
