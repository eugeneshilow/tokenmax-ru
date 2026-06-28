import { formatCompactNumber, formatUsd, formatUsdPrecise } from '@/lib/format'
import { loadTmxLeaderboard } from '@/lib/tmx-profile-live'
import { PromptCopyBox } from '../prompt-copy-box'
import { ArrowUpRight, Flame, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SELF_SERVE_ONELINER = 'npx tokmax'

export async function generateMetadata(): Promise<Metadata> {
  const title = 'tokmax leaderboard — who burned the most at API prices'
  const description =
    'Ranked by API-equivalent $: how much each person burned across Codex + Claude Code at API prices.'
  return {
    title,
    description,
    alternates: { canonical: '/leaderboard' },
    openGraph: { title, description, url: 'https://tokmax.vibecoding.tech/leaderboard', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function TmxLeaderboardPage() {
  const rows = await loadTmxLeaderboard(100)

  const t = {
    eyebrow: 'leaderboard',
    title: 'Who burned the most at API prices.',
    sub: 'Ranked by API-equivalent $ — what your Codex + Claude Code usage would cost at API prices. Run it and land on the board.',
    rank: '#',
    nick: 'nick',
    api: 'API-equivalent',
    tokens: 'tokens',
    machines: 'machines',
    empty: 'Empty so far — be the first.',
    buildEyebrow: 'build your own',
    buildTitle: 'Your counter — one command.',
    buildPara:
      'Run the command in your terminal — it reads your local Codex and Claude Code logs, computes the API-equivalent, and puts you on this board. Only aggregates leave your machine.',
    attribution: 'Prices: LiteLLM · Counting: ccusage',
  }

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] [font-variant-numeric:tabular-nums]">
      <section className="border-b border-[#242428] bg-[#070707] text-white">
        <div className="mx-auto max-w-[1680px] px-4 py-8 md:px-6 md:py-10">
          <div className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#FF7A1A]">
            <Trophy className="h-4 w-4" /> {t.eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-balance text-[40px] font-black leading-[0.95] text-white sm:text-[56px] lg:text-[68px]">
            {t.title}
          </h1>
          <p className="mt-6 max-w-3xl text-[16px] leading-7 text-[#D2D2D7] md:text-[19px]">{t.sub}</p>
          <div className="mt-7 inline-flex h-10 items-center rounded-lg border border-white/20 px-4 font-mono text-[13px] font-bold">
            {SELF_SERVE_ONELINER}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1680px] px-4 py-6 md:px-6">
          {rows.length === 0 ? (
            <p className="py-16 text-center text-[16px] font-semibold text-[#6E6E73]">{t.empty}</p>
          ) : (
            <div className="overflow-x-auto border border-[#D2D2D7]">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead className="bg-[#F5F5F7] text-[11px] font-black uppercase tracking-[0.08em] text-[#6E6E73]">
                  <tr>
                    <th className="border-b border-[#D2D2D7] px-4 py-3 text-right">{t.rank}</th>
                    <th className="border-b border-[#D2D2D7] px-4 py-3">{t.nick}</th>
                    <th className="border-b border-[#D2D2D7] px-4 py-3 text-right">{t.api}</th>
                    <th className="border-b border-[#D2D2D7] px-4 py-3 text-right">{t.tokens}</th>
                    <th className="border-b border-[#D2D2D7] px-4 py-3">{t.machines}</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] font-semibold">
                  {rows.map((row, i) => (
                    <tr key={row.nick} className="border-b border-[#D2D2D7] hover:bg-[#F5F8FC]">
                      <td className="px-4 py-4 text-right font-black tabular-nums">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-4 py-4 font-black">
                        <Link href={`/${row.nick}`} className="inline-flex items-center gap-1 hover:text-[#FF7A1A]">
                          {row.nick}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-[#FF7A1A]" title={formatUsdPrecise(row.costUsd)}>
                        {formatUsd(row.costUsd)}
                      </td>
                      <td className="px-4 py-4 text-right text-[#6E6E73]">{formatCompactNumber(row.totalTokens)}</td>
                      <td className="px-4 py-4 text-[12px] font-semibold text-[#6E6E73]">
                        {row.machineLabels.join(' + ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section id="build-your-counter" className="border-t border-[#242428] bg-[#070707] text-white">
        <div className="mx-auto grid max-w-[1680px] gap-5 px-4 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] md:px-6 md:py-10">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#18D86B]">
              {t.buildEyebrow}
            </p>
            <h2 className="mt-3 max-w-2xl text-[30px] font-black leading-[1.0] md:text-[44px]">
              {t.buildTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] font-semibold leading-7 text-[#D2D2D7]">{t.buildPara}</p>
            <p className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#6E6E73]">
              <Flame className="h-3.5 w-3.5 text-[#FF7A1A]" /> {t.attribution}
            </p>
          </div>
          <PromptCopyBox prompt={SELF_SERVE_ONELINER} />
        </div>
      </section>
    </div>
  )
}
