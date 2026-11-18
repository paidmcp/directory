# paidmcp/directory

Next.js directory site for discoverability of paid MCP servers.

End users can connect:

- natively to MCP (`<endpoint>/mcp`)
- via managed wallet mode (`paidmcp-client`) for spend caps/confirmations

## Listing categories

- `listingType: "live"` for production, third-party paid MCPs.
- `listingType: "example"` for reference/demo MCPs from PaidMCP examples.

The homepage renders these sections separately.

## User-facing features

- Card-level quick-connect copy button
- Native and managed install snippets on detail pages
- Search and chain filters
- Connect walkthrough at `/connect`
- Optional Plausible analytics via `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

## Commands

```bash
pnpm install
pnpm run dev
```

## Data source

Listings are stored in `directory.json` and updated via pull requests.

### How to request a listing

1. Fork this repo.
2. Add your MCP object to `directory.json` under `mcps`.
3. Use `listingType: "live"` for real public services.
4. Check your endpoint: `pnpm run check:endpoints -- --id <your-id>`.
5. Open a PR. The PR template asks for your endpoint, maintainer contact, and the check output.
6. Optionally set `trialSupported: true` if your MCP supports free testnet onboarding.

### Listing rules

`pnpm run validate:data` enforces these, and CI runs it on every PR:

- `endpoint` is the HTTPS base URL. Clients connect to `<endpoint>/mcp`, so don't include `/mcp`.
- `chains` must come from `chains.json` and list only chains your endpoint accepts payment on (max 4). To request a new chain, open a PR that adds it to `chains.json` along with a live listing that uses it.
- `tools` lists paid tools only, max 30, with names matching your live `tools/list`. `priceUsdt` is the price per call in US dollars; the token users pay with depends on the chain (see `token` in `chains.json`, e.g. USDC on Base, USDT0 on Plasma).
- Up to 8 lowercase `tags`. `id` is a lowercase slug.
- Only the documented fields are accepted. Put maintainer contact in the PR body and your project README.
- One PR per listing. Listings whose endpoint stops responding may be removed.

### Automated checks

Every PR runs:

- `validate:data`: the listing rules above.
- `format:check`: Prettier formatting (don't reformat other entries).
- `check:endpoints` on new or changed listings:
  - `<endpoint>/mcp` must answer MCP `initialize`, and every listed tool must appear in the live `tools/list`.
  - An unpaid `tools/call` must ask for an x402 payment in one of the supported ways: HTTP 402, a payment request in the tool result ([x402 MCP transport](https://github.com/coinbase/x402/blob/main/specs/transports-v2/mcp.md), paid via `_meta["x402/payment"]`), or a link to a paid URL (`{ url, status: 402, challenge }`).
  - **The server must actually read payments.** The check sends a payment with an invalid, all-zero signature the way the server asked for it, and the answer must differ from the unpaid one (for example "invalid signature"). Such a payment can never be settled. A server that answers exactly as if nothing was sent cannot be paid by any client and fails.
- A production build.

A daily workflow runs `check:endpoints` on every listing and keeps one open issue (label `endpoint-health`) listing anything that fails.

## License

MIT. See `LICENSE`.
