"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Tool = { name: string; description: string; priceUsdt: number };
type Mcp = {
  id: string;
  name: string;
  tagline: string;
  tags: string[];
  endpoint: string;
  chains?: string[];
  trialSupported?: boolean;
  tools: Tool[];
  listingType?: string;
};

export function McpCard({ mcp }: { mcp: Mcp }) {
  const [copied, setCopied] = useState(false);
  const prices = mcp.tools.map((t) => t.priceUsdt);
  const min = Math.min(...prices).toFixed(3);
  const max = Math.max(...prices).toFixed(3);
  const connectSnippet = useMemo(() => {
    let name = mcp.id;
    try {
      name = new URL(mcp.endpoint).hostname.split(".")[0] || mcp.id;
    } catch {
      // keep id
    }
    return `{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["paidmcp-client", "run", "${mcp.endpoint}"]
    }
  }
}`;
  }, [mcp.endpoint, mcp.id]);

  const copyConnect = async (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(connectSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.a
      href={`/mcp/${mcp.id}`}
      className="group hover-lift block rounded-xl border border-neutral-800/80 bg-neutral-900/65 p-5"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-neutral-100">{mcp.name}</h3>
        <div className="flex gap-2">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[11px] text-emerald-200">
            {mcp.tools.length} tools
          </span>
          <span
            className={`rounded-full border px-2 py-1 font-mono text-[11px] ${
              (mcp.listingType ?? "example") === "live"
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                : "border-neutral-600 bg-neutral-800/70 text-neutral-200"
            }`}
          >
            {(mcp.listingType ?? "example") === "live" ? "live" : "example"}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{mcp.tagline}</p>
      <p className="mt-3 font-mono text-xs text-neutral-400">
        Price range: ${min} - ${max} USDT
      </p>
      {mcp.chains && mcp.chains.length > 0 ? (
        <p className="mt-1 text-xs text-neutral-400">
          Chains: {mcp.chains.join(", ")}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
        {mcp.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded border border-neutral-700 bg-neutral-800/70 px-2 py-1 text-xs text-neutral-300 transition-colors group-hover:border-neutral-600"
          >
            {tag}
          </span>
        ))}
        {mcp.trialSupported ? (
          <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
            free trial
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-cyan-300 opacity-80 transition-opacity group-hover:opacity-100">
          Open MCP details -&gt;
        </div>
        <button
          type="button"
          onClick={copyConnect}
          className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:border-neutral-500"
        >
          {copied ? "Copied" : "Quick connect"}
        </button>
      </div>
    </motion.a>
  );
}
