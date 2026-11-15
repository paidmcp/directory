# New Directory Listing

## What this PR adds

- MCP name:
- Endpoint:
- Maintainer contact:
- GitHub repo:

## Listing entry checklist

- [ ] Added one valid object to `directory.json` under `mcps`
- [ ] `id` is unique and stable
- [ ] `listingType` is `live` (use `example` only for PaidMCP demo/reference listings)
- [ ] `endpoint` is the HTTPS base URL (no trailing `/mcp`); clients connect to `<endpoint>/mcp`
- [ ] Unpaid tool call returns valid 402 payment requirements
- [ ] `chains` only lists chains the endpoint accepts payment on, from `chains.json` (max 4)
- [ ] Each tool has `name`, `description`, and positive `priceUsdt`, and names match the live `tools/list`
- [ ] No extra fields (contact details go in the PR body and project README)
- [ ] Ran `pnpm run validate:data` and `pnpm run format:check`
- [ ] `tags` are present and useful for discovery
- [ ] Project README includes setup, pricing, and maintainer support/contact details

## Quick verification

Paste brief evidence here (curl response, screenshot, or logs):

```text
# example:
# curl -i -X POST https://your-endpoint/mcp \
#   -H "Accept: application/json, text/event-stream" \
#   -H "Content-Type: application/json" \
#   -d '{"jsonrpc":"2.0","id":"verify","method":"tools/call","params":{"name":"your_tool","arguments":{"sample":"input"}}}'
```

## Notes for reviewers

Anything specific you want maintainers to check?
