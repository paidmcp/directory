import { AnimatedInView } from "../../../components/AnimatedInView";
import data from "../../../directory.json";
import { InstallSnippet } from "../../../components/InstallSnippet";
import { PricingTable } from "../../../components/PricingTable";

export default async function McpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          {mcp.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-300">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm text-neutral-400">Endpoint: {mcp.endpoint}</p>
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
