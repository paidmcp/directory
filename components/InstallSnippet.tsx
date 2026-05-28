"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export function InstallSnippet({ endpoint }: { endpoint: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => {
    let name = "paid-mcp";
    try {
      name = new URL(endpoint).hostname.split(".")[0] || name;
    } catch {
      // keep fallback
    }
    return `{
  "mcpServers": {
    "${name}": {
      "command": "paidmcp",
      "args": ["run", "${endpoint}"]
    }
  }
}`;
  }, [endpoint]);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-300">Claude Desktop / Cursor MCP config</p>
        <motion.button
          onClick={copy}
          className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200 transition hover:scale-[1.03] hover:bg-cyan-400/20"
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {copied ? "Copied" : "Copy"}
        </motion.button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs font-mono text-neutral-200">
        {snippet}
      </pre>
    </motion.div>
  );
}
