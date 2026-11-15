// Verifies that listed MCP endpoints are live and paid:
//   1. `<endpoint>/mcp` answers an MCP `initialize`
//   2. `tools/list` contains every tool named in the listing
//   3. an unpaid `tools/call` returns an x402 payment requirement
//
// Usage:
//   node scripts/check-endpoints.mjs                 # every listing
//   node scripts/check-endpoints.mjs --id my-mcp     # one listing
//   node scripts/check-endpoints.mjs --changed base.json
//       # only listings that are new or changed compared to base.json
//   --report report.md   also write a Markdown report to this file
//
// Exits with code 1 when any checked listing fails.

import fs from "node:fs";
import path from "node:path";

const TIMEOUT_MS = 20_000;
const PROTOCOL_VERSION = "2025-06-18";

function parseArgs(argv) {
  const args = { ids: [], changed: null, report: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--id") args.ids.push(argv[(i += 1)]);
    else if (arg === "--changed") args.changed = argv[(i += 1)];
    else if (arg === "--report") args.report = argv[(i += 1)];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readListings(file) {
  return JSON.parse(fs.readFileSync(file, "utf8")).mcps;
}

function selectListings(args) {
  const listings = readListings(path.join(process.cwd(), "directory.json"));
  if (args.ids.length > 0) {
    const selected = listings.filter((mcp) => args.ids.includes(mcp.id));
    const missing = args.ids.filter(
      (id) => !selected.some((mcp) => mcp.id === id),
    );
    if (missing.length > 0) {
      throw new Error(`No listing with id: ${missing.join(", ")}`);
    }
    return selected;
  }
  if (args.changed) {
    const base = new Map(
      readListings(args.changed).map((mcp) => [mcp.id, JSON.stringify(mcp)]),
    );
    return listings.filter((mcp) => base.get(mcp.id) !== JSON.stringify(mcp));
  }
  return listings;
}

// Minimal placeholder arguments so servers that validate input before
// charging still reach the payment step.
function placeholderFor(schema) {
  switch (schema?.type) {
    case "number":
    case "integer":
      return schema.minimum ?? 1;
    case "boolean":
      return false;
    case "array":
      return [];
    case "object":
      return placeholderArgs(schema);
    default:
      if (Array.isArray(schema?.enum) && schema.enum.length > 0) {
        return schema.enum[0];
      }
      return "test";
  }
}

function placeholderArgs(schema) {
  const args = {};
  for (const key of schema?.required ?? []) {
    args[key] = placeholderFor(schema.properties?.[key]);
  }
  return args;
}

// Parses a JSON or single-event SSE response body into a JSON-RPC message.
function parseRpcBody(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const dataLines = trimmed
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  for (const line of dataLines) {
    if (line.startsWith("{")) return JSON.parse(line);
  }
  return null;
}

class McpSession {
  constructor(url) {
    this.url = url;
    this.sessionId = null;
    this.nextId = 1;
  }

  async post(body) {
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": PROTOCOL_VERSION,
      "user-agent": "paidmcp-directory-checker",
    };
    if (this.sessionId) headers["mcp-session-id"] = this.sessionId;
    const response = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const sessionId = response.headers.get("mcp-session-id");
    if (sessionId) this.sessionId = sessionId;
    const text = await response.text();
    return { status: response.status, headers: response.headers, text };
  }

  async request(method, params) {
    const response = await this.post({
      jsonrpc: "2.0",
      id: this.nextId++,
      method,
      params,
    });
    let message = null;
    try {
      message = parseRpcBody(response.text);
    } catch {
      // leave message null; callers decide what that means
    }
    return { ...response, message };
  }

  async notify(method) {
    await this.post({ jsonrpc: "2.0", method });
  }
}

// True when `value` contains an x402 payment requirement object:
// { x402Version: number, accepts: [ ...payment options ] }.
// Text content is parsed too, since many servers return the requirement as
// JSON inside a tool result's text.
function containsX402Requirement(value, depth = 0) {
  if (depth > 8 || value === null || value === undefined) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return false;
    try {
      return containsX402Requirement(JSON.parse(trimmed), depth + 1);
    } catch {
      return false;
    }
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsX402Requirement(item, depth + 1));
  }
  if (typeof value === "object") {
    if (
      typeof value.x402Version === "number" &&
      Array.isArray(value.accepts) &&
      value.accepts.length > 0
    ) {
      return true;
    }
    return Object.values(value).some((item) =>
      containsX402Requirement(item, depth + 1),
    );
  }
  return false;
}

function isPaymentRequired(response) {
  if (response.status === 402) return true;
  const header = response.headers.get("payment-required");
  if (header) {
    try {
      const decoded = Buffer.from(header, "base64").toString("utf8");
      if (containsX402Requirement(decoded)) return true;
    } catch {
      // fall through to the body
    }
  }
  return containsX402Requirement(response.message);
}

async function checkListing(mcp) {
  const base = mcp.endpoint.replace(/\/$/, "");
  const session = new McpSession(`${base}/mcp`);
  const result = { id: mcp.id, endpoint: `${base}/mcp`, ok: false, notes: [] };

  try {
    const init = await session.request("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "paidmcp-directory-checker", version: "1.0.0" },
    });
    if (init.status >= 400 || !init.message?.result) {
      result.notes.push(`initialize failed (HTTP ${init.status})`);
      return result;
    }
    await session.notify("notifications/initialized");

    const list = await session.request("tools/list", {});
    const liveTools = list.message?.result?.tools;
    if (!Array.isArray(liveTools)) {
      result.notes.push(`tools/list failed (HTTP ${list.status})`);
      return result;
    }
    const liveByName = new Map(liveTools.map((tool) => [tool.name, tool]));
    const missing = mcp.tools
      .map((tool) => tool.name)
      .filter((name) => !liveByName.has(name));
    if (missing.length > 0) {
      result.notes.push(`not in live tools/list: ${missing.join(", ")}`);
    }

    const probe = mcp.tools.find((tool) => liveByName.has(tool.name));
    if (!probe) {
      result.notes.push("no listed tool to probe for payment");
      return result;
    }
    const call = await session.request("tools/call", {
      name: probe.name,
      arguments: placeholderArgs(liveByName.get(probe.name).inputSchema),
    });
    const paid = isPaymentRequired(call);
    if (!paid) {
      result.notes.push(
        `unpaid tools/call "${probe.name}" did not return an x402 payment requirement (HTTP ${call.status})`,
      );
    }

    result.ok = paid && missing.length === 0;
    if (result.ok) {
      result.notes.push(
        `${liveTools.length} live tools; "${probe.name}" requires payment`,
      );
    }
  } catch (error) {
    const cause = error?.cause?.code ?? error?.cause?.message;
    result.notes.push(
      `request failed: ${error?.name === "TimeoutError" ? `timed out after ${TIMEOUT_MS / 1000}s` : (cause ?? error?.message ?? String(error))}`,
    );
  }
  return result;
}

function toMarkdown(results) {
  const rows = results.map(
    (r) =>
      `| ${r.ok ? "✅" : "❌"} | \`${r.id}\` | ${r.endpoint} | ${r.notes.join("; ").replace(/\|/g, "\\|")} |`,
  );
  return [
    "| | Listing | MCP endpoint | Result |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

let args;
let listings;
try {
  args = parseArgs(process.argv.slice(2));
  listings = selectListings(args);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

if (listings.length === 0) {
  console.log("No listings to check.");
  if (args.report) fs.writeFileSync(args.report, "No listings to check.\n");
  process.exit(0);
}

const results = await Promise.all(listings.map(checkListing));
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}  ${r.notes.join("; ")}`);
}

const markdown = toMarkdown(results);
if (args.report) fs.writeFileSync(args.report, `${markdown}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Endpoint check\n\n${markdown}\n`,
  );
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} listings passed.`);
process.exit(failed > 0 ? 1 : 0);
