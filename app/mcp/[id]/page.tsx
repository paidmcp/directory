import type { Metadata } from "next";
import { AnimatedInView } from "../../../components/AnimatedInView";
import data from "../../../directory.json";
import { InstallSnippet } from "../../../components/InstallSnippet";
import { PricingTable } from "../../../components/PricingTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return data.mcps.map((mcp) => ({ id: mcp.id }));
}

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const mcp = data.mcps.find((item) => item.id === params.id);
  if (!mcp) {
    return { title: "MCP not found" };
  }

  return {
    title: mcp.name,
    description: mcp.tagline,
    alternates: { canonical: `/mcp/${mcp.id}` },
    openGraph: {
      title: mcp.name,
      description: mcp.tagline,
      url: `https://paidmcp.dev/mcp/${mcp.id}`,
      type: "website",
    },
  };
}

export default function McpDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const mcp = data.mcps.find((item) => item.id === id);
  if (!mcp) {
    return <main className="mx-auto max-w-4xl px-6 py-12">MCP not found.</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AnimatedInView>
        <section className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-semibold md:text-4xl">{mcp.name}</h1>
          <p className="mt-3 max-w-3xl text-neutral-300">{mcp.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                (mcp.listingType ?? "example") === "live"
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  : "border-neutral-700 bg-neutral-900/60 text-neutral-300"
              }`}
            >
              {(mcp.listingType ?? "example") === "live"
                ? "Live listing"
                : "Example listing"}
            </span>
            {mcp.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-neutral-400">
            Endpoint: {mcp.endpoint}
          </p>
          <p className="mt-1 text-sm text-neutral-400">Author: {mcp.author}</p>
        </section>
      </AnimatedInView>

      <AnimatedInView className="mt-10" delay={0.06}>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Pricing</h2>
          <PricingTable tools={mcp.tools} />
        </section>
      </AnimatedInView>

      <AnimatedInView className="mt-10" delay={0.1}>
        <section>
          <h2 className="mb-3 text-xl font-semibold">Install</h2>
          <InstallSnippet endpoint={mcp.endpoint} />
        </section>
      </AnimatedInView>
    </main>
  );
}
