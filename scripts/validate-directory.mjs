import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const filePath = path.join(root, "directory.json");

function fail(message) {
  console.error(`directory.json validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  fail("directory.json file is missing");
}

let parsed;
try {
  const raw = fs.readFileSync(filePath, "utf8");
  parsed = JSON.parse(raw);
} catch (error) {
  fail(
    `invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
  );
}

if (!parsed || !Array.isArray(parsed.mcps)) {
  fail('top-level "mcps" must be an array');
}

const ids = new Set();
const listingTypes = new Set(["live", "example"]);
const chains = new Set(["base", "plasma"]);

for (const [index, mcp] of parsed.mcps.entries()) {
  const prefix = `mcps[${index}]`;

  if (!mcp || typeof mcp !== "object") {
    fail(`${prefix} must be an object`);
  }

  const requiredStringFields = [
    "id",
    "name",
    "tagline",
    "description",
    "author",
    "github",
    "endpoint",
    "addedAt",
  ];
  for (const field of requiredStringFields) {
    if (typeof mcp[field] !== "string" || mcp[field].trim().length === 0) {
      fail(`${prefix}.${field} must be a non-empty string`);
    }
  }

  if (ids.has(mcp.id)) {
    fail(`${prefix}.id "${mcp.id}" is duplicated`);
  }
  ids.add(mcp.id);

  if (!listingTypes.has(mcp.listingType)) {
    fail(`${prefix}.listingType must be "live" or "example"`);
  }

  try {
    const endpointUrl = new URL(mcp.endpoint);
    if (endpointUrl.protocol !== "https:") {
      fail(`${prefix}.endpoint must use https`);
    }
  } catch {
    fail(`${prefix}.endpoint must be a valid URL`);
  }

  try {
    new URL(mcp.github);
  } catch {
    fail(`${prefix}.github must be a valid URL`);
  }

  if (!Array.isArray(mcp.chains) || mcp.chains.length === 0) {
    fail(`${prefix}.chains must be a non-empty array`);
  }
  for (const chain of mcp.chains) {
    if (!chains.has(chain)) {
      fail(`${prefix}.chains contains unsupported value "${chain}"`);
    }
  }

  if (!Array.isArray(mcp.tags) || mcp.tags.length === 0) {
    fail(`${prefix}.tags must be a non-empty array`);
  }
  for (const tag of mcp.tags) {
    if (typeof tag !== "string" || tag.trim().length === 0) {
      fail(`${prefix}.tags entries must be non-empty strings`);
    }
  }

  if (!Array.isArray(mcp.tools) || mcp.tools.length === 0) {
    fail(`${prefix}.tools must be a non-empty array`);
  }
  for (const [toolIndex, tool] of mcp.tools.entries()) {
    const toolPrefix = `${prefix}.tools[${toolIndex}]`;
    if (!tool || typeof tool !== "object") {
      fail(`${toolPrefix} must be an object`);
    }
    if (typeof tool.name !== "string" || tool.name.trim().length === 0) {
      fail(`${toolPrefix}.name must be a non-empty string`);
    }
    if (
      typeof tool.description !== "string" ||
      tool.description.trim().length === 0
    ) {
      fail(`${toolPrefix}.description must be a non-empty string`);
    }
    if (
      typeof tool.priceUsdt !== "number" ||
      !Number.isFinite(tool.priceUsdt) ||
      tool.priceUsdt <= 0
    ) {
      fail(`${toolPrefix}.priceUsdt must be a positive number`);
    }
  }
}

console.log(
  `directory.json validation passed for ${parsed.mcps.length} MCP entries.`,
);
