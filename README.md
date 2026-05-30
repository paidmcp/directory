# paidmcp/directory

Next.js directory site for discoverability of paid MCP servers.

End users connect to listed MCPs through the client proxy documented in [`../client/README.md`](../client/README.md).

## Listing categories

- `listingType: "live"` for production, third-party paid MCPs.
- `listingType: "example"` for reference/demo MCPs from PaidMCP examples.

The homepage renders these sections separately.

## Commands

```bash
npm install
npm run dev
```

## Data source

Listings are stored in `directory.json` and updated via pull requests.

### How to request a listing

1. Fork this repo.
2. Add your MCP object to `directory.json` under `mcps`.
3. Use `listingType: "live"` for real public services.
4. Open a PR with endpoint, pricing, and maintainer contact.

### PR checklist (copy into PR body)

- [ ] Added a single valid JSON object under `mcps` in `directory.json`
- [ ] `listingType` is set to `live`
- [ ] `endpoint` is HTTPS and returns 402 requirements on unpaid tool calls
- [ ] Included maintainer contact and setup/pricing details in project README
- [ ] Tool names, descriptions, and `priceUsdt` values are complete and accurate

### CI checks on pull requests

PRs run automated checks that:

- validate required fields and URLs in `directory.json`
- enforce supported values (`listingType`, chains, positive `priceUsdt`)
- verify the app still builds
