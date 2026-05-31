import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connect & Pay",
  description:
    "Step-by-step guide to connect paid MCPs with free testnet onboarding.",
  alternates: { canonical: "/connect" },
};

export default function ConnectPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Connect & pay in 4 steps</h1>
      <p className="mt-3 text-neutral-300">
        Start free on Base Sepolia, then switch to live stablecoins when ready.
      </p>

      <ol className="mt-8 list-decimal space-y-5 pl-5 text-neutral-200">
        <li>
          Install and initialize managed wallet mode:
          <pre className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs font-mono">
            {`npx paidmcp-client init
npx paidmcp-client wallet`}
          </pre>
        </li>
        <li>
          Copy a config from any listing card (Quick connect) or open detail
          page install snippets.
        </li>
        <li>
          Paste into your MCP config, restart your client, and call a tool.
        </li>
        <li>
          Move to live mode once validated, with spend caps still enabled.
        </li>
      </ol>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
        >
          Browse MCPs
        </Link>
        <a
          href="https://github.com/paidmcp/client#readme"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100"
        >
          Client docs
        </a>
      </div>
    </main>
  );
}
