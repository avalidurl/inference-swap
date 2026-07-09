#!/usr/bin/env node
/**
 * CURB launch dispatch — email (Resend) + XMTP fan-out via feedhub estate.
 * Usage: ADMIN_TOKEN=... node scripts/send-curb-launch.mjs
 * Prefer: poll CURB feed first so origin_feed=curb, then blast with origin_feed=curb.
 *
 * Note: feedhub broadcasts PK is exactly-once per canonical_url. To re-blast after a
 * rewrite, delete the broadcasts row for this URL in D1 first, then run this script.
 */
import {
  DISPATCH_LAUNCH,
  launchSummary,
  launchEmailHtml,
} from "../src/blog.js";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const FEEDHUB = process.env.FEEDHUB_URL || "https://api.gokhan.vc";
const XMTP_BOT = process.env.XMTP_BOT_URL || "https://xmtp-bot.gokhan.vc";

const CANONICAL = `https://curb.numetal.xyz${DISPATCH_LAUNCH.path}`;
const TITLE = DISPATCH_LAUNCH.title;
const SUBJECT = DISPATCH_LAUNCH.title;
const SUMMARY = launchSummary();
const HTML = launchEmailHtml(CANONICAL);

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
