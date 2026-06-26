// tokenmax (L2) pricing fact-pack — SINGLE SOURCE OF TRUTH for API-equivalent $.
//
// Зачем здесь: цены API меняются, а захардкоженные в CLI протухнут и оценка
// наврёт. Сервер считает $ из присланных токенов по ЭТОМУ канону, а CLI тянет
// его же через `GET /api/tmx/pricing`. Значит превью в терминале == то, что
// хранится и показывается на странице. Pure-модуль без convex-импортов: его
// читает и ingest-мутация, и HTTP-роут.
//
// db-канон фактов (docs/2-product/db/README.md): у каждого факта есть source,
// verifiedAt и ttlDays. Цены сверены с fact-pack карточек (lib/entity-cards/
// codex.ts, claude-code.ts, verifiedAt 2026-06-10) и официальными pricing-
// страницами провайдеров. Кэш/ризонинг-ставки выведены по стандартным правилам
// провайдеров (Anthropic: cache write = 1.25× input, cache read = 0.1× input,
// reasoning биллится как output; OpenAI: cached input дешевле, cache write по
// input-ставке, reasoning как output).

export type TmxProvider = 'OpenAI' | 'Anthropic'
export type TmxTool = 'codex' | 'claude-code'

/** Ставки в долларах за 1,000,000 токенов соответствующего типа. */
export type TmxPerMillion = {
  input: number
  output: number
  cacheCreate: number
  cacheRead: number
  reasoning: number
}

export type TmxModelRate = {
  /** Канонический id модели (как в pricing-страницах). */
  id: string
  /** Альтернативные строки модели, встречающиеся в локальных логах. */
  aliases: string[]
  provider: TmxProvider
  tool: TmxTool
  perMillion: TmxPerMillion
}

/** Поток токенов одной модели (как читается из JSONL). */
export type TmxModelUsage = {
  input: number
  output: number
  cacheCreate: number
  cacheRead: number
  reasoning: number
}

export const TMX_PRICING_VERSION = '2026-06-10'
export const TMX_PRICING_VERIFIED_AT = '2026-06-10'
export const TMX_PRICING_TTL_DAYS = 30

export const TMX_PRICING_SOURCES = [
  { label: 'Anthropic API pricing', url: 'https://www.anthropic.com/pricing' },
  { label: 'OpenAI API pricing', url: 'https://openai.com/api/pricing' },
  {
    label: 'vibecoding.ru fact-pack (Codex)',
    url: 'https://vibecoding.ru/base/tools/codex',
  },
  {
    label: 'vibecoding.ru fact-pack (Claude Code)',
    url: 'https://vibecoding.ru/base/coding-agents/claude-code',
  },
] as const

// OpenAI: cacheCreate по input-ставке (отдельной платы за запись кэша нет),
// cacheRead — дисконтированный cached input, reasoning биллится как output.
// Anthropic: cacheCreate = 1.25× input (5-мин TTL), cacheRead = 0.1× input,
// reasoning биллится как output.
export const TMX_MODEL_RATES: TmxModelRate[] = [
  // ---- OpenAI / Codex ----
  {
    id: 'gpt-5.5',
    aliases: ['gpt-5.5-codex', 'gpt-5-codex', 'gpt-5', 'codex'],
    provider: 'OpenAI',
    tool: 'codex',
    perMillion: { input: 5, output: 30, cacheCreate: 5, cacheRead: 0.5, reasoning: 30 },
  },
  {
    id: 'gpt-5.4',
    aliases: ['gpt-5.4-codex'],
    provider: 'OpenAI',
    tool: 'codex',
    perMillion: { input: 2.5, output: 15, cacheCreate: 2.5, cacheRead: 0.25, reasoning: 15 },
  },
  {
    id: 'gpt-5.4-mini',
    aliases: ['gpt-5-mini', 'gpt-5.5-mini', 'o4-mini'],
    provider: 'OpenAI',
    tool: 'codex',
    perMillion: { input: 0.75, output: 4.5, cacheCreate: 0.75, cacheRead: 0.075, reasoning: 4.5 },
  },
  // ---- Anthropic / Claude Code ----
  {
    id: 'claude-fable-5',
    aliases: ['fable-5', 'fable'],
    provider: 'Anthropic',
    tool: 'claude-code',
    perMillion: { input: 10, output: 50, cacheCreate: 12.5, cacheRead: 1.0, reasoning: 50 },
  },
  {
    id: 'claude-opus-4-8',
    aliases: ['claude-opus-4-8[1m]', 'claude-opus-4-1', 'claude-3-opus', 'opus'],
    provider: 'Anthropic',
    tool: 'claude-code',
    perMillion: { input: 5, output: 25, cacheCreate: 6.25, cacheRead: 0.5, reasoning: 25 },
  },
  {
    id: 'claude-sonnet-4-6',
    aliases: ['claude-sonnet-4-5', 'claude-3-5-sonnet', 'claude-3-7-sonnet', 'sonnet'],
    provider: 'Anthropic',
    tool: 'claude-code',
    perMillion: { input: 3, output: 15, cacheCreate: 3.75, cacheRead: 0.3, reasoning: 15 },
  },
  {
    id: 'claude-haiku-4-5',
    aliases: ['claude-3-5-haiku', 'claude-3-haiku', 'haiku'],
    provider: 'Anthropic',
    tool: 'claude-code',
    perMillion: { input: 1, output: 5, cacheCreate: 1.25, cacheRead: 0.1, reasoning: 5 },
  },
]

// Фолбэк для неизвестной модели: средне-консервативная ставка, чтобы новая
// модель не обнуляла оценку и не завышала её абсурдно. Помечается флагом
// hasUnknownModels.
export const TMX_FALLBACK_RATE: TmxPerMillion = {
  input: 3,
  output: 15,
  cacheCreate: 3.75,
  cacheRead: 0.3,
  reasoning: 15,
}

function normalizeModelId(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Сопоставляет строку модели из логов с канонической ставкой.
 * 1) точное совпадение id; 2) алиас; 3) эвристика по семейству; 4) null.
 */
export function resolveModelRate(modelId: string): TmxModelRate | null {
  const id = normalizeModelId(modelId)
  if (!id) return null

  for (const rate of TMX_MODEL_RATES) {
    if (normalizeModelId(rate.id) === id) return rate
    if (rate.aliases.some((alias) => normalizeModelId(alias) === id)) return rate
  }

  // Эвристика по семейству — переживает мелкие смены неймингов/суффиксов дат.
  const byFamily = (needle: string) =>
    TMX_MODEL_RATES.find((rate) => normalizeModelId(rate.id).includes(needle)) ?? null

  if (id.includes('opus')) return byFamily('opus')
  if (id.includes('sonnet')) return byFamily('sonnet')
  if (id.includes('haiku')) return byFamily('haiku')
  if (id.includes('fable')) return byFamily('fable')
  if (id.includes('mini')) return byFamily('mini')
  if (id.includes('gpt-5.4')) return byFamily('gpt-5.4')
  if (id.includes('gpt-5') || id.includes('codex')) return byFamily('gpt-5.5')

  return null
}

/** $ за поток токенов одной модели по заданной ставке. */
export function costUsdForUsage(perMillion: TmxPerMillion, usage: TmxModelUsage): number {
  return (
    (usage.input * perMillion.input +
      usage.output * perMillion.output +
      usage.cacheCreate * perMillion.cacheCreate +
      usage.cacheRead * perMillion.cacheRead +
      usage.reasoning * perMillion.reasoning) /
    1_000_000
  )
}

/** Тело ответа `GET /api/tmx/pricing` — фактпак с провенансом. */
export function buildPricingFactPack() {
  return {
    version: TMX_PRICING_VERSION,
    verifiedAt: TMX_PRICING_VERIFIED_AT,
    ttlDays: TMX_PRICING_TTL_DAYS,
    currency: 'USD' as const,
    unit: 'per_million_tokens' as const,
    sources: TMX_PRICING_SOURCES,
    note: 'Authoritative server-side rates. CLI uses these to preview; the server recomputes $ from submitted token counts with the same table, so preview == published.',
    models: TMX_MODEL_RATES,
    fallback: TMX_FALLBACK_RATE,
  }
}
