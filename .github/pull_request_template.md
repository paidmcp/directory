<!--
Adding or updating a listing? Fill in the listing sections below.
For a site or tooling change, replace this template with a summary and screenshots.
-->

## Listing

- MCP name:
- Listing `id`:
- Endpoint:
- Maintainer contact:
- GitHub repo:
- New listing or update:

## Checklist

- [ ] One object added or changed under `mcps` in `directory.json`, with other entries left untouched (no reformatting)
- [ ] `listingType` is `live`
- [ ] `endpoint` is the HTTPS base URL (no trailing `/mcp`); clients connect to `<endpoint>/mcp`
- [ ] `chains` lists only chains the endpoint accepts payment on, from `chains.json` (max 4)
- [ ] Tool names match the live `tools/list`, and each tool has a positive `priceUsdt` (USD price per call)
- [ ] No extra fields (contact details go here and in your project README)
- [ ] Ran `pnpm run validate:data`, `pnpm run format:check`, and `pnpm run check:endpoints -- --id <your-id>`

## Endpoint check output

```text
# paste the output of: pnpm run check:endpoints -- --id <your-id>
```
