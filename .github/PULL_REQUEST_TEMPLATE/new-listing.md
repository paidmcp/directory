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
- [ ] `endpoint` is HTTPS and reachable
- [ ] Unpaid tool call returns valid 402 payment requirements
- [ ] `chains` only includes supported values (`base`, `plasma`)
- [ ] Each tool has `name`, `description`, and positive `priceUsdt`
- [ ] `tags` are present and useful for discovery
- [ ] Project README includes setup, pricing, and maintainer support/contact details

## Quick verification

Paste brief evidence here (curl response, screenshot, or logs):

```text
# example:
# curl -i -X POST https://your-endpoint/tools/your_tool \
#   -H "Content-Type: application/json" \
#   -d '{"sample":"input"}'
```

## Notes for reviewers

Anything specific you want maintainers to check?
