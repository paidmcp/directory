import { AnimatedInView } from "../../components/AnimatedInView";

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <AnimatedInView>
        <section className="glass rounded-2xl p-8">
        <h1 className="text-3xl font-semibold">Submit your MCP</h1>
        <p className="mt-4 text-neutral-300">
        Open a pull request against <code className="font-mono">directory.json</code> with your MCP entry.
        </p>
        <ul className="mt-6 space-y-2 text-neutral-300">
          <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">Working HTTPS endpoint</li>
          <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
            Returns valid 402 requirements on unpaid call
          </li>
          <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
            README with setup and pricing details
          </li>
          <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">Sensible per-call pricing</li>
          <li className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">Maintainer contact information</li>
        </ul>
        </section>
      </AnimatedInView>
    </main>
  );
}
