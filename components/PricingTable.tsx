type Tool = { name: string; description: string; priceUsdt: number };

export function PricingTable({ tools }: { tools: Tool[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800/80 bg-neutral-900/60">
      <table className="min-w-full divide-y divide-neutral-800/80 text-sm">
        <thead className="bg-neutral-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-neutral-200">Tool</th>
            <th className="px-4 py-3 text-left text-neutral-200">
              Description
            </th>
            <th className="px-4 py-3 text-left text-neutral-200">
              Price (USDT)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/80">
          {tools.map((tool) => (
            <tr
              key={tool.name}
              className="transition-colors hover:bg-neutral-800/40"
            >
              <td className="px-4 py-3 font-mono">{tool.name}</td>
              <td className="px-4 py-3 text-neutral-300">{tool.description}</td>
              <td className="px-4 py-3 font-mono text-emerald-300">
                ${tool.priceUsdt.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
