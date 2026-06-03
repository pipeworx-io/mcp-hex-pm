interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Hex.pm MCP — package registry for the Elixir & Erlang ecosystems.
 * Keyless. Hex.pm requires a User-Agent header on every request.
 */


const BASE = 'https://hex.pm/api';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_package',
    description:
      'Look up a single Hex.pm package (Elixir/Erlang mix package) by name. Returns description, licenses, links, latest version, and download counts.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Package name, e.g. "phoenix" or "ecto".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_packages',
    description:
      'Search the Hex.pm registry for Elixir/Erlang mix packages by keyword. Returns a list of matching packages with descriptions, latest versions, and downloads.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term, e.g. "json" or "http client".' },
        sort: {
          type: 'string',
          enum: ['downloads', 'name', 'recent_downloads'],
          description: 'Sort order (default "downloads").',
        },
        page: { type: 'number', description: 'Page number, 1-based (default 1).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_release',
    description:
      'Get details for a specific version (release) of a Hex.pm package (Elixir/Erlang mix package): dependency requirements, docs availability, publisher, and downloads.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Package name, e.g. "phoenix".' },
        version: { type: 'string', description: 'Version string, e.g. "1.7.0".' },
      },
      required: ['name', 'version'],
    },
  },
  {
    name: 'list_releases',
    description:
      'List all published versions (releases) of a Hex.pm package (Elixir/Erlang mix package), each with its version and publish date.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Package name, e.g. "phoenix".' },
      },
      required: ['name'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_package': {
      const pkg = reqStr(args, 'name', '"phoenix"');
      const data = await hexGet(`/packages/${encodeURIComponent(pkg)}`);
      if (isError(data)) return data;
      const p = data as Record<string, any>;
      const meta = (p.meta ?? {}) as Record<string, any>;
      return {
        name: p.name,
        description: meta.description,
        licenses: meta.licenses,
        links: meta.links,
        latest_version: p.latest_stable_version ?? p.latest_version,
        downloads: p.downloads,
        html_url: p.html_url,
        inserted_at: p.inserted_at,
        updated_at: p.updated_at,
      };
    }
    case 'search_packages': {
      const query = reqStr(args, 'query', '"json"');
      const sort = (args.sort as string | undefined) ?? 'downloads';
      const page = (args.page as number | undefined) ?? 1;
      const data = await hexGet(
        `/packages?search=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}&page=${encodeURIComponent(String(page))}`,
      );
      if (isError(data)) return data;
      const list = Array.isArray(data) ? data : [];
      return list.map((p: Record<string, any>) => ({
        name: p.name,
        description: p.meta?.description,
        latest_version: p.latest_stable_version ?? p.latest_version,
        downloads: p.downloads,
        html_url: p.html_url,
      }));
    }
    case 'get_release': {
      const pkg = reqStr(args, 'name', '"phoenix"');
      const version = reqStr(args, 'version', '"1.7.0"');
      const data = await hexGet(
        `/packages/${encodeURIComponent(pkg)}/releases/${encodeURIComponent(version)}`,
      );
      if (isError(data)) return data;
      const r = data as Record<string, any>;
      return {
        name: pkg,
        version: r.version,
        has_docs: r.has_docs,
        inserted_at: r.inserted_at,
        requirements: r.requirements,
        downloads: r.downloads,
        publisher: r.publisher?.username,
      };
    }
    case 'list_releases': {
      const pkg = reqStr(args, 'name', '"phoenix"');
      const data = await hexGet(`/packages/${encodeURIComponent(pkg)}`);
      if (isError(data)) return data;
      const p = data as Record<string, any>;
      return {
        name: p.name,
        releases: ((p.releases ?? []) as Record<string, any>[]).map((r) => ({
          version: r.version,
          inserted_at: r.inserted_at,
        })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function hexGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { error: res.status, message: text.slice(0, 200) || res.statusText };
  }
  return res.json();
}

function isError(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'error' in (data as Record<string, unknown>);
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim())
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
