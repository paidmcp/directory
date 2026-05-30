import type { Metadata } from "next";
import { AnimatedInView } from "../../components/AnimatedInView";
import { MagneticButton } from "../../components/MagneticButton";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Build your own paid MCP",
  description:
    "Start from the PaidMCP template and launch a paid MCP endpoint.",
  alternates: {
    canonical: "/build",
  },
};

export default function BuildPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <AnimatedInView>
        <section className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-semibold">Build your own paid MCP</h1>
          <p className="mt-4 text-neutral-300">
            Start from the open template, define paid tools in one file, and
            deploy a USDT-priced MCP endpoint.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="https://github.com/paidmcp/template"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MagneticButton className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/20">
                Open template repo
              </MagneticButton>
            </Link>
            <Link
              href="https://github.com/paidmcp/client"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MagneticButton className="rounded-md border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-sm transition hover:border-neutral-500">
                Open client repo
              </MagneticButton>
            </Link>
          </div>
        </section>
      </AnimatedInView>
    </main>
  );
}
