import chainConfig from "../chains.json";

export type Chain = { id: string; label: string; token: string };

export const chains: Chain[] = chainConfig.chains;

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

/**
 * How a listing can be paid, grouped by token, e.g.
 * "USDC on Base or Polygon · USDT0 on Plasma".
 */
export function paymentOptions(chainIds: string[] | undefined): string {
  const byToken = new Map<string, string[]>();
  for (const id of chainIds ?? []) {
    const chain = chains.find((c) => c.id === id);
    if (!chain) continue;
    byToken.set(chain.token, [
      ...(byToken.get(chain.token) ?? []),
      chain.label,
    ]);
  }
  return [...byToken]
    .map(([token, labels]) => `${token} on ${joinLabels(labels)}`)
    .join(" · ");
}
