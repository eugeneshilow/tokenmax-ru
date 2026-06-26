// Pricing factpack: fetch the authoritative per-million rates the server uses,
// resolve a model id to its rates, and compute the API-equivalent $ with the
// exact same formula the server applies — so the CLI preview equals the
// published number.

/** GET <apiBase>/api/tmx/pricing */
export async function fetchPricing(apiBase) {
  const res = await fetch(`${apiBase}/api/tmx/pricing`);
  if (!res.ok) throw new Error(`pricing request failed: HTTP ${res.status}`);
  return res.json();
}

/**
 * Resolve a model id to its perMillion rates.
 * Order: exact id -> alias -> longest prefix match (family heuristic) -> fallback.
 */
export function resolveRates(pricing, model) {
  const id = String(model || '').toLowerCase();
  const models = pricing.models || [];

  for (const m of models) {
    if (String(m.id).toLowerCase() === id) return m.perMillion;
  }
  for (const m of models) {
    if ((m.aliases || []).some((a) => String(a).toLowerCase() === id)) {
      return m.perMillion;
    }
  }
  // Family heuristic: pick the model whose id/alias is the longest prefix of the
  // requested id (e.g. "claude-opus-4-8-20990101" -> claude-opus-4-8). Longest
  // wins so "gpt-5.5" never collapses to the shorter "gpt-5" alias of a mini.
  let best = null;
  let bestLen = -1;
  for (const m of models) {
    for (const cand of [m.id, ...(m.aliases || [])]) {
      const c = String(cand).toLowerCase();
      if (id.startsWith(c) && c.length > bestLen) {
        best = m.perMillion;
        bestLen = c.length;
      }
    }
  }
  if (best) return best;

  return pricing.fallback;
}

/** costUsd for a single model's token buckets, matching the server formula. */
export function costForModel(rates, tok) {
  return (
    (tok.input * rates.input +
      tok.output * rates.output +
      tok.cacheCreate * rates.cacheCreate +
      tok.cacheRead * rates.cacheRead +
      tok.reasoning * rates.reasoning) /
    1e6
  );
}

/** Sum costUsd across all aggregated model buckets. */
export function previewCost(pricing, models) {
  let usd = 0;
  for (const m of models) {
    usd += costForModel(resolveRates(pricing, m.model), m);
  }
  return usd;
}
