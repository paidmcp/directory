"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export function InstallSnippet({ endpoint }: { endpoint: string }) {
  const [copiedKey, setCopiedKey] = useState<"managed" | "native" | null>(null);

  const snippets = useMemo(() => {
    let name = "paid-mcp";
    try {
      name = new URL(endpoint).hostname.split(".")[0] || name;
    } catch {
      // keep fallback
    }
    return {
      managed: `{
  "mcpServers": {
    "${name}": {
      "command": "npx",
      "args": ["paidmcp-client", "run", "${endpoint}"]
    }
  }
}`,
      native: `{
  "mcpServers": {
    "${name}-native": {
      "url": "${endpoint}/mcp"
    }
  }
}`,
    };
  }, [endpoint]);

  const copy = async (key: "managed" | "native") => {
    await navigator.clipboard.writeText(snippets[key]);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <motion.div
      className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-300">MCP config options</p>
        <div className="flex gap-2 text-xs">
          <a
            href="https://docs.cursor.com/context/model-context-protocol"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-200 hover:border-neutral-500"
          >
            Add to Cursor
          </a>
          <a
            href="https://modelcontextprotocol.io/docs/clients"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-neutral-700 px-2 py-1 text-neutral-200 hover:border-neutral-500"
          >
            Add to Claude
          </a>
        </div>
      </div>

      <p className="mb-2 text-xs text-neutral-400">
        Managed wallet mode (recommended for budgets, confirmations, and testnet
        onboarding)
      </p>
      <div className="mb-4">
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => copy("managed")}
            className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
            type="button"
          >
            {copiedKey === "managed" ? "Copied" : "Copy managed"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs font-mono text-neutral-200">
          {snippets.managed}
        </pre>
      </div>

      <p className="mb-2 text-xs text-neutral-400">
        Native MCP URL mode (no proxy)
      </p>
      <div>
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => copy("native")}
            className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
            type="button"
          >
            {copiedKey === "native" ? "Copied" : "Copy native"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs font-mono text-neutral-200">
          {snippets.native}
        </pre>
      </div>
    </motion.div>
  );
}
