import { composeAnsiArt } from '@/lib/ansi-money'

// Giant two-tone ANSI-Shadow dollar figure — the Money Terminal display face
// (matches the approved terminal-card mockup): solid blocks in burn orange
// with a soft glow, box-drawing shadow chars in translucent orange.

const BLOCK_CHARS = new Set(['█', '▄', '▀'])

type Run = { text: string; block: boolean }

function splitRuns(line: string): Run[] {
  const runs: Run[] = []
  for (const ch of line) {
    const block = BLOCK_CHARS.has(ch)
    const last = runs[runs.length - 1]
    if (last && last.block === block) {
      last.text += ch
    } else {
      runs.push({ text: ch, block })
    }
  }
  return runs
}

export function AnsiMoney({ value }: { value: string }) {
  const lines = composeAnsiArt(value)
  const cols = Math.max(...lines.map((l) => l.length))
  return (
    <div style={{ containerType: 'inline-size' }}>
      <pre
        aria-label={value}
        className="overflow-hidden leading-[1.05]"
        // System mono, NOT the next/font-subsetted brand mono: block/box-drawing
        // glyphs (█╔═) live outside the latin subset, and a fallback font with
        // different metrics shreds the column alignment of the art.
        // Fit the art to the card: mono glyph ≈ 0.6em wide → fs ≤ 100cqw/(0.6·cols).
        style={{
          fontFamily: "ui-monospace, 'SF Mono', Menlo, 'Cascadia Mono', monospace",
          fontSize: `min(17px, ${(160 / cols).toFixed(2)}cqw)`,
        }}
      >
        {lines.map((line, i) => (
          <div key={i}>
            {splitRuns(line).map((run, j) =>
              run.block ? (
                <span
                  key={j}
                  className="text-[#FF7A1A]"
                  style={{ textShadow: '0 0 12px rgba(255,122,26,0.22)' }}
                >
                  {run.text}
                </span>
              ) : (
                <span key={j} className="text-[#FF7A1A]/35">
                  {run.text}
                </span>
              )
            )}
          </div>
        ))}
      </pre>
    </div>
  )
}
