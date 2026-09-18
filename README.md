# mcp-hex-pm

Hex.pm MCP — package registry for the Elixir & Erlang ecosystems.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1481+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_package` | Look up a single Hex.pm package (Elixir/Erlang mix package) by name. Returns description, licenses, links, latest version, and download counts. |
| `search_packages` | Search the Hex.pm registry for Elixir/Erlang mix packages by keyword. Returns a list of matching packages with descriptions, latest versions, and downloads. |
| `get_release` | Get details for a specific version (release) of a Hex.pm package (Elixir/Erlang mix package): dependency requirements, docs availability, publisher, and downloads. |
| `list_releases` | List all published versions (releases) of a Hex.pm package (Elixir/Erlang mix package), each with its version and publish date. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "hex_pm": {
      "url": "https://gateway.pipeworx.io/hex_pm/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/hex_pm/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1481+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Hex Pm data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/hex_pm_get_package \
  -H 'Content-Type: application/json' \
  -d '{"name":"phoenix"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/hex_pm_get_package`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
