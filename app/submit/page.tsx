import type { Metadata } from "next";
import { AnimatedInView } from "../../components/AnimatedInView";

export const metadata: Metadata = {
  title: "Submit your MCP",
  description:
    "Open a PR to request your live paid MCP listing in the PaidMCP Directory.",
  alternates: {
    canonical: "/submit",
  },
};

export default function SubmitPage() {
  const examplePayload = `{
  "id": "your-mcp-id",
  "name": "Your MCP Name",
  "tagline": "One-line value proposition",
  "description": "What your paid MCP does.",
  "author": "your-team-or-handle",
  "github": "https://github.com/your-org/your-repo",
  "endpoint": "https://your-mcp.example.com",
  "listingType": "live",
  "trialSupported": true,
  "chains": ["base", "plasma"],
  "tools": [
    { "name": "your_tool", "description": "What it does", "priceUsdt": 0.01 }
  ],
  "tags": ["your-tag"],
  "addedAt": "2026-05-30"
}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <AnimatedInView>
        <section className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-semibold">Submit your MCP</h1>
          <p className="mt-4 text-neutral-300">
            Open a pull request against{" "}
            <code className="font-mono">directory.json</code> with your MCP
            entry.
          </p>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-neutral-300">
            <li>Fork the repository.</li>
            <li>
              Add your object to the <code className="font-mono">mcps</code>{" "}
              array in <code className="font-mono">directory.json</code>.
            </li>
            <li>
              Set <code className="font-mono">listingType</code> to{" "}
              <code className="font-mono">live</code> for production MCPs.
            </li>
            <li>
              Open a PR describing your endpoint, pricing, and maintainer
              contact.
            </li>
          </ol>
          <p className="mt-4 text-sm text-neutral-400">
            CI will validate required fields in{" "}
            <code className="font-mono">directory.json</code> and run a
            production build before merge.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href="https://github.com/paidmcp/directory/fork"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-neutral-700 bg-neutral-900/60 px-3 py-2 hover:border-neutral-500"
            >
              Fork repository
            </a>
            <a
              href="https://github.com/paidmcp/directory/compare/main...main?quick_pull=1&title=Add%20new%20PaidMCP%20listing&template=.github/PULL_REQUEST_TEMPLATE/new-listing.md"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-cyan-100"
            >
              Open prefilled PR
            </a>
          </div>
          <ul className="mt-6 space-y-2 text-neutral-300">
            <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              Working HTTPS endpoint
            </li>
            <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              Returns valid 402 requirements on unpaid call
            </li>
            <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              README with setup and pricing details
            </li>
            <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              Sensible per-call pricing
            </li>
            <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              Maintainer contact information
            </li>
          </ul>
          <p className="mt-6 text-sm text-neutral-400">Entry template:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 text-xs text-neutral-200">
            {examplePayload}
          </pre>
        </section>
      </AnimatedInView>
    </main>
  );
}
