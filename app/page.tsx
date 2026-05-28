import Link from "next/link";
import { AnimatedInView } from "../components/AnimatedInView";
import { MagneticButton } from "../components/MagneticButton";
import data from "../directory.json";
import { McpCard } from "../components/McpCard";

export default function HomePage() {
  const totalTools = data.mcps.reduce((acc, mcp) => acc + mcp.tools.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <section className="glass relative overflow-hidden rounded-2xl p-8 md:p-12">
        <div className="absolute -left-20 top-0 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-300" />
            Agentic AI Marketplace
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            Discover and deploy
            <span className="animated-gradient-text"> paid MCP servers </span>
            with frictionless per-call payments.
          </h1>
          <p className="mt-4 max-w-3xl text-neutral-300">
            Powered by x402 + Tether WDK. Build composable AI tools, price each call in USDT, and ship production-ready
            agents without subscriptions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-neutral-200">
              {data.mcps.length} MCPs listed
            </span>
            <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-neutral-200">
              {totalTools} paid tools
            </span>
            <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-neutral-200">
              AI-native payments
            </span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/build">
              <MagneticButton className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20">
                Build your MCP
              </MagneticButton>
            </Link>
            <Link href="/submit">
              <MagneticButton className="rounded-md border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-sm transition hover:border-neutral-500">
                Submit listing
              </MagneticButton>
            </Link>
          </div>
        </div>
      </section>

      <AnimatedInView className="mt-10" delay={0.08}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured MCPs</h2>
          <p className="text-sm text-neutral-400">Curated for reliability and pricing clarity</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.mcps.map((mcp) => (
            <McpCard key={mcp.id} mcp={mcp} />
          ))}
        </div>
      </AnimatedInView>
    </main>
  );
}
