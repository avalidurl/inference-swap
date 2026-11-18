import { Agent } from "agents";
import {
  type HarnessEnv,
  CURB_MCP,
  CURB_API,
  agentSkin,
  json,
  parseMcpText,
} from "./shared";

type BuyerState = {
  role: "buyer";
  mcpReady: boolean;
  mcpServerId: string | null;
  lastMatchId: string | null;
  lastIntentAt: string | null;
  lastChallenge: unknown;
  lastError: string | null;
};

/**
 * Live CURB buyer agent — Cloudflare Agents SDK.
 * Lists offers, creates intents, fetches pay challenges via CURB MCP.
 * Payment signing is outside this agent (pay MCP / agentcash) — no keys here.
 */
export class CurbBuyer extends Agent<HarnessEnv, BuyerState> {
  initialState: BuyerState = {
    role: "buyer",
    mcpReady: false,
    mcpServerId: null,
    lastMatchId: null,
    lastIntentAt: null,
    lastChallenge: null,
    lastError: null,
  };

  async onStart() {
    await this.ensureMcp();
  }

  async ensureMcp() {
    const mcpUrl = this.env.CURB_MCP_URL || CURB_MCP;
    const result = await this.addMcpServer("curb", mcpUrl, {
      transport: { type: "streamable-http" },
      callbackHost: "https://buyer.curb.numetal.xyz",
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

  async listOffers(limit = 20) {
    return this.mcpCall("swap_list_offers", { limit });
  }

  async createIntent(body: {
    model?: string;
    mtok?: number;
    maxPriceUsd?: number;
    offerId?: string;
    buyer?: string;
  } = {}) {
    const model = body.model || this.env.DEMO_MODEL || "demo/llama-3.3-70b";
    const mtok = Number(body.mtok ?? 1);
    const maxPriceUsd = Number(body.maxPriceUsd ?? 1);
    const args: Record<string, unknown> = {
      model,
      mtok,
      maxPriceUsd,
      buyer: body.buyer || "0x0000000000000000000000000000000000000b0b",
    };
    if (body.offerId) args.offerId = body.offerId;

    try {
      const result = (await this.mcpCall("swap_create_intent", args)) as {
        match?: { id?: string };
        id?: string;
        challenge?: unknown;
      };
      const matchId = result.match?.id || result.id || null;
      this.setState({
        ...this.state,
        lastMatchId: matchId,
        lastIntentAt: new Date().toISOString(),
        lastChallenge: result.challenge || result.match || null,
        lastError: null,
      });
      return { ok: true, result };
    } catch {
      this.setState({
        ...this.state,
        lastError: "request failed",
        lastIntentAt: new Date().toISOString(),
      });
      return { ok: false, error: "request failed" };
    }
  }

  async payChallenge(matchId?: string) {
    const id = matchId || this.state.lastMatchId;
    if (!id) return { ok: false, error: "matchId_required" };
    try {
      const challenge = await this.mcpCall("swap_pay_challenge", { matchId: id });
      this.setState({
        ...this.state,
        lastMatchId: id,
        lastChallenge: challenge,
        lastError: null,
      });
      return {
        ok: true,
        matchId: id,
        challenge,
        paymentNote:
          "CURB does not sign. Settle the single gross accept (→ on-chain 0xSplits split) with agentcash or any x402 client, then call seller endpoint with the grant.",
        payUrl: `${this.env.CURB_API_URL || CURB_API}/v1/matches/${id}/pay`,
      };
    } catch {
      this.setState({ ...this.state, lastError: "request failed" });
      return { ok: false, error: "request failed" };
    }
  }

  async getMatch(matchId?: string) {
    const id = matchId || this.state.lastMatchId;
    if (!id) return { ok: false, error: "matchId_required" };
    return { ok: true, match: await this.mcpCall("swap_get_match", { matchId: id }) };
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

    if (path.endsWith("/health") || path.endsWith("/status")) {
      const mcp = this.getMcpServers();
      return json({
        ok: true,
        agent: "curb-buyer",
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
        payment:
          "Use pay MCP or agentcash outside this agent. No private keys in the harness.",
      });
    }

    if (path.endsWith("/mcp-tools") && request.method === "GET") {
      await this.ensureMcp();
      await this.mcp.waitForConnections({ timeout: 15_000 });
      return json({ tools: this.getMcpServers().tools });
    }

    if (path.endsWith("/list") && request.method === "POST") {
      return json(await this.listOffers());
    }

    if (path.endsWith("/intent") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      return json(
        await this.createIntent({
          model: body.model as string | undefined,
          mtok: body.mtok as number | undefined,
          maxPriceUsd: body.maxPriceUsd as number | undefined,
          offerId: body.offerId as string | undefined,
          buyer: body.buyer as string | undefined,
        })
      );
    }

    if (path.endsWith("/pay-challenge") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { matchId?: string };
      return json(await this.payChallenge(body.matchId));
    }

    if (path.endsWith("/match") && request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as { matchId?: string };
      return json(await this.getMatch(body.matchId));
    }

    if (request.method === "GET" && (path === "/" || path.endsWith("/agents/curb-buyer/default"))) {
      const status = {
        agent: "curb-buyer",
        mcpReady: this.state.mcpReady,
        lastMatchId: this.state.lastMatchId,
        lastIntentAt: this.state.lastIntentAt,
        lastError: this.state.lastError,
      };
      return new Response(
        agentSkin({
          title: "curb-buyer",
          role: "buyer",
          origin: url.origin,
          mcpUrl: this.env.CURB_MCP_URL || CURB_MCP,
          status,
          actionsHtml: `
            <div class="row">
              <button type="button" onclick="run('/list')">List offers (MCP)</button>
              <button type="button" onclick="run('/intent',{mtok:1,maxPriceUsd:1})">Create intent</button>
              <button type="button" onclick="run('/pay-challenge',{})">Pay challenge</button>
              <a class="btn" href="/health">GET /health</a>
            </div>
            <p style="color:var(--muted);font-size:.9rem;margin:.75rem 0 0">Payment signing stays in <strong>pay</strong> / <strong>agentcash</strong> — this agent only drives CURB MCP.</p>
          `,
        }),
        { headers: { "content-type": "text/html; charset=utf-8" } }
      );
    }

    return json({ error: "not_found", agent: "curb-buyer", path }, 404);
  }
}
