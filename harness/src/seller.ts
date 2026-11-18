import { Agent } from "agents";
import {
  type HarnessEnv,
  CURB_MCP,
  CURB_API,
  agentSkin,
  json,
  parseMcpText,
} from "./shared";

type SellerState = {
  role: "seller";
  mcpReady: boolean;
  mcpServerId: string | null;
  lastOfferId: string | null;
  lastEnsureAt: string | null;
  lastError: string | null;
  fulfillCount: number;
};

/**
 * Live CURB seller agent — Cloudflare Agents SDK.
 * Maintains ≥1 open offer via CURB MCP and fulfills at /fulfill (OpenAI-compat stub).
 */
export class CurbSeller extends Agent<HarnessEnv, SellerState> {
  initialState: SellerState = {
    role: "seller",
    mcpReady: false,
    mcpServerId: null,
    lastOfferId: null,
    lastEnsureAt: null,
    lastError: null,
    fulfillCount: 0,
  };

  async onStart() {
    try {
      await this.ensureMcp();
    } catch (e) {
      this.setState({
        ...this.state,
        lastError: `onStart_mcp: ${String((e as Error)?.message || e)}`,
      });
    }
    // Recurring book-fill every 15 minutes (also woken by Worker cron).
    try {
      await this.schedule("*/15 * * * *", "ensureOfferJob", {});
    } catch {
      // schedule may already exist after restart
    }
  }

  async ensureMcp() {
    const mcpUrl = this.env.CURB_MCP_URL || CURB_MCP;
    const result = await this.addMcpServer("curb", mcpUrl, {
      transport: { type: "streamable-http" },
      callbackHost: "https://seller.curb.numetal.xyz",
    });
    this.setState({
      ...this.state,
      mcpReady: result.state === "ready",
      mcpServerId: result.id,
      lastError: result.state === "ready" ? null : `mcp_${result.state}`,
    });
    return result;
  }

  async mcpCall(name: string, args: Record<string, unknown> = {}) {
    await this.ensureMcp();
    const serverId = this.state.mcpServerId;
    if (!serverId) throw new Error("mcp_not_connected");
    await this.mcp.waitForConnections({ timeout: 15_000 });
    const raw = await this.mcp.callTool({
      serverId,
      name,
      arguments: args,
    });
    return parseMcpText(raw);
  }

  /** Scheduled / cron entry — keep the book non-empty. */
  async ensureOfferJob(_payload: Record<string, unknown> = {}) {
    return this.ensureOpenOffer();
  }

  async ensureOpenOffer() {
    const api = this.env.CURB_API_URL || CURB_API;
    const model = this.env.DEMO_MODEL || "demo/llama-3.3-70b";
    const mtok = Number(this.env.DEMO_MTOK || 10);
    const priceUsd = Number(this.env.DEMO_PRICE_USD || 0.5);
    const sellerPayTo = this.env.SELLER_PAY_TO || "0x3eee81B5b4cf1983b7DB36cf042B5d06c04F33eE";
    const sellerSolPayTo = this.env.SELLER_SOL_PAY_TO || "2onXWK1M43AZHYbM7EFaLG7rhqZkt9JWxgGjZziq4tCg";
    const endpoint = "https://seller.curb.numetal.xyz/fulfill";

    try {
      const listed = (await this.mcpCall("swap_list_offers", { limit: 50 })) as {
        offers?: Array<{ id: string; note?: string | null; endpoint?: string; status?: string }>;
      };
      const offers = listed.offers || [];
      const ours = offers.find(
        (o) =>
          o.endpoint === endpoint ||
          (typeof o.note === "string" && o.note.includes("curb-seller-harness"))
      );
      if (ours) {
        this.setState({
          ...this.state,
          lastOfferId: ours.id,
          lastEnsureAt: new Date().toISOString(),
          lastError: null,
        });
        return { ok: true, action: "already_open", offerId: ours.id, openOffers: offers.length };
      }

      const created = (await this.mcpCall("swap_create_offer", {
        sellerPayTo,
        sellerSolPayTo,
        endpoint,
        model,
        mtok,
        priceUsd,
        note: "curb-seller-harness live demo offer",
      })) as { id?: string };

      this.setState({
        ...this.state,
        lastOfferId: created.id || null,
        lastEnsureAt: new Date().toISOString(),
        lastError: null,
      });
      return {
        ok: true,
        action: "created",
        offer: created,
        openOffers: offers.length + 1,
        api,
      };
    } catch {
      this.setState({
        ...this.state,
        lastError: "request failed",
        lastEnsureAt: new Date().toISOString(),
      });
      return { ok: false, error: "request failed" };
    }
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, authorization",
        },
      });
    }

    // OpenAI-compatible fulfill stub — buyers call this after grant.
    if (path.endsWith("/fulfill") && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const n = (this.state.fulfillCount || 0) + 1;
      this.setState({ ...this.state, fulfillCount: n });
      const auth = request.headers.get("authorization") || "";
      return json({
        id: `chatcmpl-curb-demo-${n}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: this.env.DEMO_MODEL || "demo/llama-3.3-70b",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "CURB demo seller fulfilled. Replace this endpoint with real capacity. Hub never held upstream keys.",
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 12, completion_tokens: 24, total_tokens: 36 },
        curb: {
          demo: true,
          agent: "curb-seller",
          grantPresent: /^Bearer\s+/i.test(auth),
          echo: body,
        },
      });
    }

    if (path.endsWith("/health") || path.endsWith("/status")) {
      const mcp = this.getMcpServers();
      return json({
        ok: true,
        agent: "curb-seller",
        product: "numetal-curb",
        harness: "cloudflare-agents-sdk",
        mcpUrl: this.env.CURB_MCP_URL || CURB_MCP,
        mcpTools: (mcp.tools || []).map((t: { name: string }) => t.name),
        mcpServers: Object.fromEntries(
          Object.entries(mcp.servers || {}).map(([id, s]) => [
            id,
            { name: (s as { name?: string }).name, state: (s as { state?: string }).state },
          ])
        ),
        state: this.state,
      });
    }

    if (path.endsWith("/ensure") && request.method === "POST") {
      return json(await this.ensureOpenOffer());
    }

    if (path.endsWith("/mcp-tools") && request.method === "GET") {
      await this.ensureMcp();
      await this.mcp.waitForConnections({ timeout: 15_000 });
      const mcp = this.getMcpServers();
      return json({ tools: mcp.tools });
    }

    if (path.endsWith("/list") && request.method === "POST") {
      return json(await this.mcpCall("swap_list_offers", { limit: 20 }));
    }

    // Pretty landing for the agent itself
    if (request.method === "GET" && (path === "/" || path.endsWith("/agents/curb-seller/default"))) {
      const status = {
        agent: "curb-seller",
        mcpReady: this.state.mcpReady,
        lastOfferId: this.state.lastOfferId,
        lastEnsureAt: this.state.lastEnsureAt,
        fulfillCount: this.state.fulfillCount,
        lastError: this.state.lastError,
      };
      return new Response(
        agentSkin({
          title: "curb-seller",
          role: "seller",
          origin: url.origin,
          mcpUrl: this.env.CURB_MCP_URL || CURB_MCP,
          status,
          actionsHtml: `
            <div class="row">
              <button type="button" onclick="run('/ensure')">Ensure open offer</button>
              <button type="button" onclick="run('/list')">List offers (MCP)</button>
              <a class="btn" href="/health">GET /health</a>
              <a class="btn" href="/mcp-tools">GET /mcp-tools</a>
            </div>
            <p style="color:var(--muted);font-size:.9rem;margin:.75rem 0 0">Fulfill: <code>POST /fulfill</code> (OpenAI-compat stub). Cron + schedule keep the book filled.</p>
          `,
        }),
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    // Allow POSTs that hit agent root with action query
    if (request.method === "POST") {
      const action = url.searchParams.get("action");
      if (action === "ensure") return json(await this.ensureOpenOffer());
      if (action === "list") return json(await this.mcpCall("swap_list_offers", { limit: 20 }));
    }

    return json({ error: "not_found", agent: "curb-seller", path }, 404);
  }
}
