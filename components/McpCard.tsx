"use client";

import { motion } from "framer-motion";

type Tool = { name: string; description: string; priceUsdt: number };
type Mcp = { id: string; name: string; tagline: string; tags: string[]; tools: Tool[] };

export function McpCard({ mcp }: { mcp: Mcp }) {
  const prices = mcp.tools.map((t) => t.priceUsdt);
  const min = Math.min(...prices).toFixed(3);
  const max = Math.max(...prices).toFixed(3);

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
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[11px] text-emerald-200">
          {mcp.tools.length} tools
        </span>
      </div>
      <p className="mt-2 text-sm text-neutral-300">{mcp.tagline}</p>
      <p className="mt-3 font-mono text-xs text-neutral-400">Price range: ${min} - ${max} USDT</p>
      <div className="mt-4 flex gap-2">
        {mcp.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded border border-neutral-700 bg-neutral-800/70 px-2 py-1 text-xs text-neutral-300 transition-colors group-hover:border-neutral-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 text-xs text-cyan-300 opacity-80 transition-opacity group-hover:opacity-100">
        Open MCP details -&gt;
      </div>
    </motion.a>
  );
}
