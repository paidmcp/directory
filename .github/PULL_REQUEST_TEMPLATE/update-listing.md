# Update Existing Listing

## Listing being updated

- Listing `id`:
- MCP name:
- Endpoint (if changed):
- Maintainer contact:

## What changed

- [ ] Pricing updated
- [ ] Tools added or removed
- [ ] Tool descriptions updated
- [ ] Tags updated
- [ ] Endpoint changed
- [ ] Other metadata changed

## Change checklist

- [ ] Updated only the intended listing object in `directory.json`
- [ ] `listingType` remains correct (`live` for production listings)
- [ ] All changed tools still include `name`, `description`, and positive `priceUsdt`
- [ ] Endpoint is still HTTPS and reachable
- [ ] Unpaid tool call still returns valid 402 requirements
- [ ] README/docs reflect any pricing or endpoint changes

## Verification evidence

Paste proof for changed behavior (curl response, screenshot, logs):

```text
# example:
# curl -i -X POST https://your-endpoint/mcp \
#   -H "Accept: application/json, text/event-stream" \
#   -H "Content-Type: application/json" \
#   -d '{"jsonrpc":"2.0","id":"verify","method":"tools/call","params":{"name":"updated_tool","arguments":{"sample":"input"}}}'
```

## Notes for reviewers

Anything risky, breaking, or time-sensitive?
