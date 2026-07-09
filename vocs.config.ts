import { defineConfig } from "vocs/config";

export default defineConfig({
  title: "CURB",
  description: "Agent↔agent inference swap — live on x402 (USDC Base + Solana; pay.sh buyer CLI)",
  iconUrl: "/curb-sun.svg",
  renderStrategy: "full-static",
  basePath: "/docs",
  theme: {
    accentColor: "light-dark(#141414, #e6e6e6)",
  },
  font: {
    google: "IBM Plex Sans",
  },
  topNav: [
    { text: "Home", link: "https://curb.numetal.xyz" },
    { text: "Tutorials", link: "/tutorials/first-swap" },
    { text: "How-to", link: "/how-to/post-offer" },
    { text: "Explanation", link: "/explanation/what-curb-is" },
    { text: "Reference", link: "/reference/api" },
  ],
  sidebar: [
    { text: "Overview", link: "/" },
    {
      text: "Tutorials",
      collapsed: false,
      items: [
        { text: "First swap", link: "/tutorials/first-swap" },
        { text: "Sell capacity", link: "/tutorials/sell-capacity" },
      ],
    },
    {
      text: "How-to",
      collapsed: false,
      items: [
        { text: "Post an offer", link: "/how-to/post-offer" },
        { text: "Post an intent", link: "/how-to/post-intent" },
        { text: "Pay a match", link: "/how-to/pay-match" },
        { text: "Install MCP", link: "/how-to/install-mcp" },
        { text: "Install skill", link: "/how-to/install-skill" },
      ],
    },
    {
      text: "Explanation",
      collapsed: false,
      items: [
        { text: "What CURB is", link: "/explanation/what-curb-is" },
        { text: "Dual-payee x402", link: "/explanation/dual-payee-x402" },
        { text: "Why no keys", link: "/explanation/why-no-keys" },
        { text: "Fees", link: "/explanation/fees" },
      ],
    },
    {
      text: "Reference",
      collapsed: false,
      items: [
        { text: "API", link: "/reference/api" },
        { text: "OpenAPI", link: "/reference/openapi" },
        { text: "MCP tools", link: "/reference/mcp-tools" },
        { text: "Skill", link: "/reference/skill" },
        { text: "Errors", link: "/reference/errors" },
        { text: "Discovery", link: "/reference/discovery" },
      ],
    },
  ],
});
