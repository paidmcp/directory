// Verifies that listed MCP endpoints are live and paid:
//   1. `<endpoint>/mcp` answers an MCP `initialize`
//   2. `tools/list` contains every tool named in the listing
//   3. an unpaid `tools/call` returns an x402 payment requirement, as an
//      HTTP 402, inside the tool result (x402 MCP transport), or as a link
//      to a paid URL
//   4. the server reads payments: a payment with an invalid (all-zero)
//      signature, sent the way the server asked for it, gets a different
//      answer than no payment at all. Such a payment can never settle.
//
// Usage:
//   node scripts/check-endpoints.mjs                 # every listing
//   node scripts/check-endpoints.mjs --id my-mcp     # one listing
//   node scripts/check-endpoints.mjs --changed base.json
//       # only listings that are new or changed compared to base.json
//   --report report.md   also write a Markdown report to this file
//
// Exits with code 1 when any checked listing fails.

import { randomBytes } from "node:crypto";
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
// charging still reach the payment step. Values the input schema gives
// (`const`, `default`, `examples`) are used first, so a server can steer
// the check to arguments it accepts.
function placeholderFor(schema) {
  if (schema && "const" in schema) return schema.const;
  if (schema && "default" in schema) return schema.default;
  if (Array.isArray(schema?.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }
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
      if (schema?.format === "uri" || schema?.format === "url") {
        return "https://example.com";
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

  async post(body, extraHeaders = {}) {
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": PROTOCOL_VERSION,
      "user-agent": "paidmcp-directory-checker",
      ...extraHeaders,
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

  async request(method, params, extraHeaders = {}) {
    const response = await this.post(
      { jsonrpc: "2.0", id: this.nextId++, method, params },
      extraHeaders,
    );
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

function isRequirement(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.x402Version === "number" &&
    Array.isArray(value.accepts) &&
    value.accepts.length > 0
  );
}

function parseJson(text) {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// A payment link: { url, status: 402 | payment_required: true, challenge }.
// The payment is made to that URL rather than to the MCP call.
function asPointer(value) {
  if (
    value &&
    typeof value.url === "string" &&
    (value.payment_required === true || value.status === 402) &&
    isRequirement(value.challenge)
  ) {
    return { challenge: value.challenge, pointer: value.url };
  }
  return null;
}

// Payment requirements are only recognized where standard x402 clients
// (the official @x402 libraries, paidmcp-client) look for them, so a
// listing that passes can actually be paid:
// - in a tool result (x402 MCP transport): a top-level PaymentRequired in
//   _meta["x402/error"], structuredContent, or a JSON text content item;
//   or a top-level payment link in one of those places.
function requirementInResult(message) {
  const result = message?.result;
  if (!result || typeof result !== "object") return null;
  const candidates = [result._meta?.["x402/error"], result.structuredContent];
  for (const item of Array.isArray(result.content) ? result.content : []) {
    if (item?.type === "text") candidates.push(parseJson(item.text));
  }
  for (const candidate of candidates) {
    const pointer = asPointer(candidate);
    if (pointer) return pointer;
    if (isRequirement(candidate)) return { challenge: candidate };
  }
  return null;
}

// - on HTTP 402 (x402 HTTP transport): v2 in the base64 PAYMENT-REQUIRED
//   header, v1 as the JSON body itself.
function decodeHeader(value) {
  if (!value) return null;
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    return isRequirement(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * How a response asks for payment: "http" (HTTP 402), "mcp" (requirement in
 * the tool result, x402 MCP transport), "pointer" (pay a linked URL), or
 * "nonstandard" (asks for payment in a way standard clients cannot read).
 * Returns null when it does not ask for payment.
 */
function paymentRequest(response) {
  const fromHeader = decodeHeader(response.headers.get("payment-required"));
  if (fromHeader) return { style: "http", challenge: fromHeader };
  if (response.status === 402) {
    const body = parseJson(response.text);
    if (isRequirement(body) && body.x402Version === 1) {
      return { style: "http", challenge: body };
    }
    return {
      style: "nonstandard",
      reason:
        "answers HTTP 402 without a PAYMENT-REQUIRED header (x402 v2 HTTP transport), so standard x402 clients cannot read the payment request",
    };
  }
  const found = requirementInResult(response.message);
  if (found?.pointer) {
    return { style: "pointer", challenge: found.challenge, url: found.pointer };
  }
  if (found) return { style: "mcp", challenge: found.challenge };
  return null;
}

/**
 * A well-formed x402 "exact" EVM payment whose signature is all zeros. It
 * cannot be settled by anyone; it only shows whether the server reads and
 * verifies payments sent the way it asked for them.
 */
function invalidPayment(challenge) {
  const accepted = challenge?.accepts?.find(
    (a) => a?.scheme === "exact" && String(a?.network).startsWith("eip155:"),
  );
  if (!accepted) return null;
  const now = Math.floor(Date.now() / 1000);
  const authorization = {
    from: "0x000000000000000000000000000000000000dEaD",
    to: accepted.payTo,
    value: String(accepted.amount ?? accepted.maxAmountRequired),
    validAfter: String(now - 60),
    validBefore: String(now + 120),
    nonce: `0x${randomBytes(32).toString("hex")}`,
  };
  const signature = `0x${"00".repeat(65)}`;
  if (challenge.x402Version === 1) {
    return {
      x402Version: 1,
      scheme: accepted.scheme,
      network: accepted.network,
      payload: { signature, authorization },
    };
  }
  // x402 v2 clients copy the challenge's resource and extensions into the
  // payment, so this one is as large as a real payment would be.
  return {
    x402Version: challenge.x402Version,
    resource: challenge.resource,
    accepted,
    payload: { signature, authorization },
    ...(challenge.extensions ? { extensions: challenge.extensions } : {}),
  };
}

const encodePayment = (payment) =>
  Buffer.from(JSON.stringify(payment)).toString("base64");

/** What a payment-related answer says, for comparing two answers. */
function rejectionReason(response) {
  const request = paymentRequest(response);
  const body = response.message ?? parseJson(response.text);
  const settlement = body?.result?._meta?.["x402/payment-response"];
  return (
    request?.challenge?.error ??
    (settlement?.success === false ? settlement.errorReason : null) ??
    (request && typeof body?.error === "string" ? body.error : null) ??
    null
  );
}

function verdict(response) {
  const body = response.message ?? parseJson(response.text);
  return JSON.stringify({
    status: response.status,
    asksForPayment: Boolean(paymentRequest(response)),
    error: rejectionReason(response),
    bodyStatus: typeof body?.status === "string" ? body.status : null,
  });
}

/** A short, single-line excerpt of an answer, for failure notes. */
function excerpt(response) {
  const result = response.message?.result;
  const text =
    result?.content?.find?.((item) => item?.type === "text")?.text ??
    response.text ??
    "";
  return String(text).replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Whether a payment answer is a recognizable x402 rejection. */
function isRejection(response) {
  const settlement = response.message?.result?._meta?.["x402/payment-response"];
  return Boolean(paymentRequest(response)) || settlement?.success === false;
}

/**
 * Sends an invalid payment the way the server asked for it and checks that
 * the answer changes. A server that answers exactly as if nothing was sent
 * never reads payments, so nobody can pay it.
 */
async function probePaymentAcceptance(session, toolCall, unpaid, request) {
  try {
    return await sendInvalidPayment(session, toolCall, unpaid, request);
  } catch (error) {
    const cause = error?.cause?.code ?? error?.cause?.message;
    return {
      ok: false,
      note: `got no answer to a payment sent the way x402 clients send it (${error?.name === "TimeoutError" ? `timed out after ${TIMEOUT_MS / 1000}s` : (cause ?? error?.message ?? String(error))}). Check that the server accepts a payment of ${encodePayment(invalidPayment(request.challenge) ?? {}).length} bytes`,
    };
  }
}

async function sendInvalidPayment(session, toolCall, unpaid, request) {
  const payment = invalidPayment(request.challenge);
  if (!payment) {
    return {
      ok: true,
      note: "payment acceptance not verified (no EVM exact option)",
    };
  }
  let before;
  let after;
  if (request.style === "http") {
    before = unpaid;
    after = await session.request("tools/call", toolCall, {
      "payment-signature": encodePayment(payment),
      "x-payment": encodePayment(payment),
    });
  } else if (request.style === "mcp") {
    before = unpaid;
    after = await session.request("tools/call", {
      ...toolCall,
      _meta: { "x402/payment": payment },
    });
  } else {
    const get = async (headers = {}) => {
      const response = await fetch(request.url, {
        headers: { accept: "application/json", ...headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await response.text();
      let message = null;
      try {
        message = JSON.parse(text);
      } catch {
        // not JSON
      }
      return {
        status: response.status,
        headers: response.headers,
        text,
        message,
      };
    };
    before = await get();
    after = await get({ "payment-signature": encodePayment(payment) });
  }
  if (
    !paymentRequest(after) &&
    after.status < 400 &&
    !after.message?.result?.isError
  ) {
    return { ok: false, note: "accepted a payment with an invalid signature" };
  }
  const channel =
    request.style === "mcp"
      ? 'in _meta["x402/payment"]'
      : request.style === "http"
        ? "in the PAYMENT-SIGNATURE header"
        : `to ${request.url}`;
  const size = encodePayment(payment).length;
  if (after.status >= 500) {
    return {
      ok: false,
      note: `answers HTTP ${after.status} to an invalid payment (${size} bytes, sent ${channel}) instead of rejecting it: ${excerpt(after)}`,
    };
  }
  if (!isRejection(after)) {
    return {
      ok: false,
      note: `answers an invalid payment sent ${channel} with something other than an x402 rejection (a new payment request with an error, or a failed payment-response): "${excerpt(after)}". If the tool rejected the checker's placeholder arguments, add \`examples\` to its input schema`,
    };
  }
  if (verdict(after) === verdict(before)) {
    return {
      ok: false,
      note: `ignores payments or hides why it rejected one: an invalid payment sent ${channel} got the same answer as no payment. Put the rejection reason in the PaymentRequired \`error\``,
    };
  }
  const error = rejectionReason(after);
  return {
    ok: true,
    note: `reads payments (invalid one rejected${error ? `: ${String(error).slice(0, 60)}` : ""})`,
  };
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
    const toolCall = {
      name: probe.name,
      arguments: placeholderArgs(liveByName.get(probe.name).inputSchema),
    };
    const call = await session.request("tools/call", toolCall);
    const request = paymentRequest(call);
    if (!request) {
      result.notes.push(
        `unpaid tools/call "${probe.name}" did not return an x402 payment requirement in a standard format (HTTP ${call.status})`,
      );
      return result;
    }
    if (request.style === "nonstandard") {
      result.notes.push(`unpaid tools/call "${probe.name}" ${request.reason}`);
      return result;
    }

    const acceptance = await probePaymentAcceptance(
      session,
      toolCall,
      call,
      request,
    );
    result.ok = acceptance.ok && missing.length === 0;
    if (acceptance.ok) {
      result.notes.push(
        `${liveTools.length} live tools; "${probe.name}" requires payment (${request.style}) and ${acceptance.note}`,
      );
    } else {
      result.notes.push(
        `"${probe.name}" requires payment but ${acceptance.note}`,
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
