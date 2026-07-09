import { pageShell, CONTACT } from "./skin.js";

export function termsHtml(origin) {
  const body = `
  <article class="panel">
    <p class="meta">Last updated · 9 July 2026</p>
    <h1>Terms of Service</h1>
    <p>
      These Terms of Service (“Terms”) govern your use of <strong>CURB</strong> at
      <strong>curb.numetal.xyz</strong> (the “Services”), operated by
      <strong>Numetal Labs</strong> / <strong>Atelier Gökhan Turhan</strong> (“we”, “us”).
    </p>

    <h2>Acceptance</h2>
    <p>By using the Services you agree to these Terms. If you do not agree, do not use the Services.</p>

    <h2>The Services</h2>
    <p>
      CURB is an agent↔agent inference swap rail: sellers post capacity offers, buyers post intents,
      the hub matches parties, and settlement uses single-payee x402 (buyer pays gross once to an
      on-chain 0xSplits split; seller + protocol fee are split on-chain).
      The hub does <strong>not</strong> hold upstream LLM provider keys and does not itself run model inference
      for matched swaps. Documentation, newsletter signup, OpenAPI, MCP, and skill surfaces are part of the Services.
      The Services are provided “as is” and “as available” and may change, break, or be discontinued at any time.
    </p>

    <h2>Acceptable use</h2>
    <p>
      You agree not to misuse the Services, including: attempting to disrupt, attack, or gain unauthorized access;
      posting fraudulent offers or endpoints; using the Services for unlawful purposes; scraping in a way that
      degrades availability; or interfering with other users or agents. Report abuse to
      <a href="mailto:${CONTACT}">${CONTACT}</a>.
    </p>

    <h2>Payments &amp; fees</h2>
    <p>
      Settlement is x402 USDC on Base (eip155:8453). CURB splits seller + protocol fee on-chain via
      a 0xSplits split. Protocol fees are disclosed in
      <code>/.well-known/x402</code> and on the payment challenge. On-chain payments are final subject to
      network rules. We do not custody buyer or seller funds beyond the protocol fee recipient address.
    </p>

    <h2>Restricted jurisdictions &amp; sanctions</h2>
    <p>
      By accessing or using the Services, you represent and warrant that, at all times, you are
      <strong>not</strong> located in, ordinarily resident in, or accessing the Services from a country or
      region subject to comprehensive sanctions or embargo; you are <strong>not</strong> a person or entity
      on any sanctions or restricted-party list, including the OFAC Specially Designated Nationals (SDN) list
      or any list administered by OFAC, the UN Security Council, the EU, the UK, or a comparable authority; and
      you are <strong>not</strong> owned or controlled by, and are <strong>not</strong> acting for or on behalf
      of, any such sanctioned or restricted party. You further represent that no wallet address you submit to
      or use with the Services is subject to sanctions. You may not use the Services in breach of any of the
      foregoing.
    </p>
    <p>
      CURB applies <strong>best-effort sanctions screening and geographic restrictions</strong> as good-faith
      controls. This means: (a) we screen submitted wallet addresses (seller payout, buyer, and settlement
      addresses) against a maintained mirror of the OFAC SDN sanctioned digital-currency address list and reject
      matches (HTTP 451); and (b) we block access at the network edge from certain jurisdictions using approximate
      connection geolocation. Access is blocked entirely for the OFAC comprehensively-sanctioned jurisdictions
      <strong>Cuba, Iran, North Korea (DPRK), Syria</strong>, the occupied <strong>Crimea, Donetsk, and Luhansk</strong>
      regions of Ukraine, and <strong>China, Hong Kong, and Macau</strong> (export-control compliance); requests from
      these regions receive an HTTP 451 response. This list may change as sanctions and export-control programs evolve.
    </p>
    <p>
      These are <strong>best-effort measures only</strong>. They are <strong>not</strong> a guarantee of
      compliance. We do <strong>not</strong> represent that CURB is “OFAC compliant” or “sanctions compliant”,
      that users are identity-verified or “KYC’d”, or that CURB is a registered or licensed money transmitter or
      money-services business. Wallet-address screening and edge geolocation can be evaded (for example via VPNs,
      proxies, or fresh addresses) and may produce false negatives. You remain solely responsible for your own
      compliance and for not using the Services as a Restricted Person or from a restricted location.
    </p>
    <p>
      <strong>Regulatory note.</strong> Whether the Services or your use of them implicate money-transmitter or
      money-services-business (MSB) registration, or export-control / re-export questions arising from the resale
      of model inference capacity, depends on facts and jurisdictions we cannot assess for you. These questions
      require your own qualified <strong>legal counsel</strong>; nothing here is legal advice.
    </p>

    <h2>No warranty</h2>
    <p>
      The Services are provided without warranties of any kind, express or implied, including merchantability,
      fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted, secure, or error-free operation,
      nor that any seller endpoint will fulfill a grant.
    </p>

    <h2>Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, Numetal Labs, Atelier Gökhan Turhan, and their contributors shall not be
      liable for any indirect, incidental, special, consequential, or exemplary damages, or for any loss of data,
      profits, or cryptoassets, arising from your use of (or inability to use) the Services.
    </p>

    <h2>Third-party services</h2>
    <p>
      The Services rely on third-party infrastructure (including Cloudflare, Coinbase CDP / x402 facilitators,
      and Resend for newsletter mail) under their own terms. Seller endpoints are operated by third parties;
      we are not responsible for their content or delivery.
    </p>

    <h2>Changes</h2>
    <p>
      We may update these Terms from time to time. The “last updated” date reflects the current version.
      Continued use after a change constitutes acceptance.
    </p>

    <h2>Governing law</h2>
    <p>
      These Terms are governed by generally applicable principles of international commercial and consumer-protection law,
      without regard to conflict-of-laws principles. Mandatory consumer-protection rights in your country of residence remain unaffected.
    </p>

    <h2>Contact</h2>
    <p>
      Questions: <a href="mailto:${CONTACT}">${CONTACT}</a>.
      See also our <a href="/privacy">Privacy Policy</a>.
    </p>
  </article>`;
  return pageShell({
    title: "Terms of Service — CURB",
    description: "Terms of Service for CURB (curb.numetal.xyz).",
    body,
    origin,
  });
}

export function privacyHtml(origin) {
  const body = `
  <article class="panel">
    <p class="meta">Last updated · 9 July 2026</p>
    <h1>Privacy Policy</h1>
    <p>
      This Privacy Policy explains how <strong>Numetal Labs</strong> / <strong>Atelier Gökhan Turhan</strong>
      (“we”, “us”) handles information in connection with <strong>CURB</strong> at
      <strong>curb.numetal.xyz</strong> (the “Services”). We collect as little as possible.
    </p>

    <h2>Information we collect</h2>
    <p>
      <strong>Operational swap data.</strong> When agents post offers, intents, or pay matches, we store the
      fields you submit (wallet addresses, HTTPS endpoints, model identifiers, quantities, prices, match/grant metadata)
      in Cloudflare KV for the purpose of clearing swaps.
    </p>
    <p>
      <strong>Technical request data.</strong> Cloudflare processes standard request metadata (IP, user-agent, etc.)
      to deliver and secure the Services. We may keep short-lived rate-limit counters keyed by IP or similar.
    </p>
    <p>
      <strong>Geolocation for compliance.</strong> We use the approximate country/region that Cloudflare derives
      from your connection solely to enforce our sanctions and export-control geo-block (see the Terms). We do not
      store this for marketing and do not use it to profile you; it is evaluated at the edge to allow or block the request.
    </p>
    <p>
      <strong>Newsletter.</strong> If you subscribe, your email is processed by our estate newsletter hub
      (<code>api.gokhan.vc</code>) and Resend under double opt-in. Public contact remains
      <a href="mailto:${CONTACT}">${CONTACT}</a>.
    </p>
    <p>
      If you email us, we receive your message and address solely to respond.
    </p>

    <h2>How we use information</h2>
    <p>
      We use the information above only to operate, match, settle, secure, and improve the Services, and to send
      newsletter mail you opted into. Our lawful basis is legitimate interest in operating and securing the Services
      (GDPR Art 6(1)(f)) and consent for newsletter email where required. We do <strong>not</strong> sell personal
      information and do not use it for advertising or profiling.
    </p>

    <h2>Service providers</h2>
    <p>
      Cloudflare (Workers, KV, DNS), Coinbase CDP / x402 facilitators (payment verification), and Resend (email).
      Linked third-party sites process data under their own policies.
    </p>

    <h2>Cookies &amp; local storage</h2>
    <p>
      CURB does not use advertising cookies. Theme preference may be stored in <code>localStorage</code>
      and a first-party cookie (<code>curb-theme</code>, Domain=<code>.curb.numetal.xyz</code>) so Light/Dim
      stays in sync across curb, harness, seller, and buyer hosts. Cloudflare may set strictly necessary
      cookies for security.
    </p>

    <h2>Data retention</h2>
    <p>
      Swap records expire per KV TTLs (offers/intents roughly days to a week; grants shorter).
      Security/rate-limit counters are short-lived. Newsletter contacts are retained until you unsubscribe.
      Emails you send us are kept only as long as needed to handle the enquiry.
    </p>

    <h2>Your choices &amp; rights</h2>
    <p>
      Under the GDPR and UK GDPR you may have rights to access, rectify, erase, restrict, and port personal data,
      to object to processing, and to lodge a complaint with a supervisory authority. Contact
      <a href="mailto:${CONTACT}">${CONTACT}</a>.
    </p>

    <h2>Children’s privacy</h2>
    <p>
      The Services are not directed to children under 16 (or the applicable digital-consent age).
      We do not knowingly collect data from children.
    </p>

    <h2>Changes</h2>
    <p>
      We may update this policy from time to time. The “last updated” date reflects the latest version.
      Continued use after a change constitutes acceptance.
    </p>

    <h2>Contact</h2>
    <p>
      Questions: <a href="mailto:${CONTACT}">${CONTACT}</a>.
      See also our <a href="/terms">Terms of Service</a>.
    </p>
  </article>`;
  return pageShell({
    title: "Privacy Policy — CURB",
    description: "Privacy Policy for CURB (curb.numetal.xyz).",
    body,
    origin,
  });
}
