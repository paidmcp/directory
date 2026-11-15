import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const filePath = path.join(root, "directory.json");
const chainsPath = path.join(root, "chains.json");

// Limits that keep listings honest and readable. They are deliberately
// generous for real services but stop keyword stuffing, "every chain" claims,
// and padded tool lists.
const LIMITS = {
  idMaxLength: 48,
  nameMaxLength: 60,
  taglineMaxLength: 120,
  descriptionMaxLength: 600,
  maxTags: 8,
  tagMaxLength: 32,
  maxChains: 4,
  maxTools: 30,
  toolNameMaxLength: 64,
  toolDescriptionMaxLength: 200,
  maxPriceUsdt: 10,
};

const ALLOWED_FIELDS = new Set([
  "id",
  "name",
  "tagline",
  "description",
  "author",
  "github",
  "endpoint",
  "listingType",
  "trialSupported",
  "chains",
  "tools",
  "tags",
  "addedAt",
]);
const ALLOWED_TOOL_FIELDS = new Set(["name", "description", "priceUsdt"]);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  console.error(`directory.json validation failed: ${message}`);
  process.exit(1);
}

function readJson(file, label) {
  if (!fs.existsSync(file)) {
    fail(`${label} file is missing`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(
      `invalid JSON in ${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function checkLength(value, max, label) {
  if (value.length > max) {
    fail(`${label} is ${value.length} characters (max ${max})`);
  }
}

const parsed = readJson(filePath, "directory.json");
const chainConfig = readJson(chainsPath, "chains.json");

if (!chainConfig || !Array.isArray(chainConfig.chains)) {
  fail('chains.json must have a top-level "chains" array');
}
for (const [index, chain] of chainConfig.chains.entries()) {
  for (const field of ["id", "label", "token"]) {
    if (typeof chain?.[field] !== "string" || chain[field].trim() === "") {
      fail(`chains.json chains[${index}].${field} must be a non-empty string`);
    }
  }
}
const chains = new Set(chainConfig.chains.map((chain) => chain.id));
if (chains.size !== chainConfig.chains.length) {
  fail("chains.json contains duplicate chain ids");
}

if (!parsed || !Array.isArray(parsed.mcps)) {
  fail('top-level "mcps" must be an array');
}

const ids = new Set();
const endpoints = new Set();
const listingTypes = new Set(["live", "example"]);
const today = new Date().toISOString().slice(0, 10);

for (const [index, mcp] of parsed.mcps.entries()) {
  const prefix = `mcps[${index}]`;

  if (!mcp || typeof mcp !== "object" || Array.isArray(mcp)) {
    fail(`${prefix} must be an object`);
  }

  for (const key of Object.keys(mcp)) {
    if (!ALLOWED_FIELDS.has(key)) {
      fail(
        `${prefix} has unsupported field "${key}" (put contact details and extra links in your project README)`,
      );
    }
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

  if (!SLUG.test(mcp.id)) {
    fail(
      `${prefix}.id "${mcp.id}" must be lowercase letters, digits, and single hyphens`,
    );
  }
  checkLength(mcp.id, LIMITS.idMaxLength, `${prefix}.id`);
  checkLength(mcp.name, LIMITS.nameMaxLength, `${prefix}.name`);
  checkLength(mcp.tagline, LIMITS.taglineMaxLength, `${prefix}.tagline`);
  checkLength(
    mcp.description,
    LIMITS.descriptionMaxLength,
    `${prefix}.description`,
  );

  if (ids.has(mcp.id)) {
    fail(`${prefix}.id "${mcp.id}" is duplicated`);
  }
  ids.add(mcp.id);

  if (!DATE.test(mcp.addedAt) || Number.isNaN(Date.parse(mcp.addedAt))) {
    fail(`${prefix}.addedAt must be a YYYY-MM-DD date`);
  }
  if (mcp.addedAt > today) {
    fail(`${prefix}.addedAt cannot be in the future`);
  }

  if (!listingTypes.has(mcp.listingType)) {
    fail(`${prefix}.listingType must be "live" or "example"`);
  }
  if (
    typeof mcp.trialSupported !== "undefined" &&
    typeof mcp.trialSupported !== "boolean"
  ) {
    fail(`${prefix}.trialSupported must be a boolean when provided`);
  }

  let endpointUrl;
  try {
    endpointUrl = new URL(mcp.endpoint);
  } catch {
    fail(`${prefix}.endpoint must be a valid URL`);
  }
  if (endpointUrl.protocol !== "https:") {
    fail(`${prefix}.endpoint must use https`);
  }
  if (endpointUrl.search || endpointUrl.hash || endpointUrl.username) {
    fail(
      `${prefix}.endpoint must not contain a query, fragment, or credentials`,
    );
  }
  if (/\/mcp\/?$/.test(endpointUrl.pathname)) {
    fail(
      `${prefix}.endpoint must be the base URL; clients connect to "<endpoint>/mcp", so drop the trailing "/mcp"`,
    );
  }
  const endpointKey = `${endpointUrl.host}${endpointUrl.pathname.replace(/\/$/, "")}`;
  if (endpoints.has(endpointKey)) {
    fail(`${prefix}.endpoint "${mcp.endpoint}" is already listed`);
  }
  endpoints.add(endpointKey);

  try {
    const githubUrl = new URL(mcp.github);
    if (githubUrl.protocol !== "https:") {
      fail(`${prefix}.github must use https`);
    }
  } catch {
    fail(`${prefix}.github must be a valid URL`);
  }

  if (!Array.isArray(mcp.chains) || mcp.chains.length === 0) {
    fail(`${prefix}.chains must be a non-empty array`);
  }
  if (mcp.chains.length > LIMITS.maxChains) {
    fail(
      `${prefix}.chains lists ${mcp.chains.length} chains (max ${LIMITS.maxChains}); only list chains your endpoint actually accepts payment on`,
    );
  }
  if (new Set(mcp.chains).size !== mcp.chains.length) {
    fail(`${prefix}.chains contains duplicates`);
  }
  for (const chain of mcp.chains) {
    if (!chains.has(chain)) {
      fail(
        `${prefix}.chains contains unsupported value "${chain}" (supported: ${[...chains].join(", ")})`,
      );
    }
  }

  if (!Array.isArray(mcp.tags) || mcp.tags.length === 0) {
    fail(`${prefix}.tags must be a non-empty array`);
  }
  if (mcp.tags.length > LIMITS.maxTags) {
    fail(
      `${prefix}.tags has ${mcp.tags.length} entries (max ${LIMITS.maxTags})`,
    );
  }
  if (new Set(mcp.tags).size !== mcp.tags.length) {
    fail(`${prefix}.tags contains duplicates`);
  }
  for (const tag of mcp.tags) {
    if (typeof tag !== "string" || !SLUG.test(tag)) {
      fail(
        `${prefix}.tags entries must be lowercase slugs like "developer-tools"`,
      );
    }
    checkLength(tag, LIMITS.tagMaxLength, `${prefix}.tags entry "${tag}"`);
  }

  if (!Array.isArray(mcp.tools) || mcp.tools.length === 0) {
    fail(`${prefix}.tools must be a non-empty array`);
  }
  if (mcp.tools.length > LIMITS.maxTools) {
    fail(
      `${prefix}.tools has ${mcp.tools.length} entries (max ${LIMITS.maxTools}); list your main paid tools`,
    );
  }
  const toolNames = new Set();
  for (const [toolIndex, tool] of mcp.tools.entries()) {
    const toolPrefix = `${prefix}.tools[${toolIndex}]`;
    if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
      fail(`${toolPrefix} must be an object`);
    }
    for (const key of Object.keys(tool)) {
      if (!ALLOWED_TOOL_FIELDS.has(key)) {
        fail(`${toolPrefix} has unsupported field "${key}"`);
      }
    }
    if (typeof tool.name !== "string" || tool.name.trim().length === 0) {
      fail(`${toolPrefix}.name must be a non-empty string`);
    }
    checkLength(tool.name, LIMITS.toolNameMaxLength, `${toolPrefix}.name`);
    if (toolNames.has(tool.name)) {
      fail(`${toolPrefix}.name "${tool.name}" is duplicated`);
    }
    toolNames.add(tool.name);
    if (
      typeof tool.description !== "string" ||
      tool.description.trim().length === 0
    ) {
      fail(`${toolPrefix}.description must be a non-empty string`);
    }
    checkLength(
      tool.description,
      LIMITS.toolDescriptionMaxLength,
      `${toolPrefix}.description`,
    );
    if (
      typeof tool.priceUsdt !== "number" ||
      !Number.isFinite(tool.priceUsdt) ||
      tool.priceUsdt <= 0
    ) {
      fail(
        `${toolPrefix}.priceUsdt must be a positive number (list paid tools only)`,
      );
    }
    if (tool.priceUsdt > LIMITS.maxPriceUsdt) {
      fail(`${toolPrefix}.priceUsdt is above ${LIMITS.maxPriceUsdt}`);
    }
  }
}

console.log(
  `directory.json validation passed for ${parsed.mcps.length} MCP entries.`,
);
