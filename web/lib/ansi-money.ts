// ANSI Shadow figlet glyphs (generated via figlet npm package) — the Money
// Terminal display face for big dollar figures. Blocks (█) render solid burn
// orange; box-drawing shadow chars (╔╗╚╝║═╝) render translucent orange —
// same two-tone technique as the approved terminal-card mockup.

const GLYPHS: Record<string, string[]> = {
  "0": [" ██████╗ ","██╔═████╗","██║██╔██║","████╔╝██║","╚██████╔╝"," ╚═════╝ "],
  "1": [" ██╗","███║","╚██║"," ██║"," ██║"," ╚═╝"],
  "2": ["██████╗ ","╚════██╗"," █████╔╝","██╔═══╝ ","███████╗","╚══════╝"],
  "3": ["██████╗ ","╚════██╗"," █████╔╝"," ╚═══██╗","██████╔╝","╚═════╝ "],
  "4": ["██╗  ██╗","██║  ██║","███████║","╚════██║","     ██║","     ╚═╝"],
  "5": ["███████╗","██╔════╝","███████╗","╚════██║","███████║","╚══════╝"],
  "6": [" ██████╗ ","██╔════╝ ","███████╗ ","██╔═══██╗","╚██████╔╝"," ╚═════╝ "],
  "7": ["███████╗","╚════██║","    ██╔╝","   ██╔╝ ","   ██║  ","   ╚═╝  "],
  "8": [" █████╗ ","██╔══██╗","╚█████╔╝","██╔══██╗","╚█████╔╝"," ╚════╝ "],
  "9": [" █████╗ ","██╔══██╗","╚██████║"," ╚═══██║"," █████╔╝"," ╚════╝ "],
  ",": ["   ","   ","   ","   ","▄█╗","╚═╝"],
  "$": ["▄▄███▄▄·","██╔════╝","███████╗","╚════██║","███████║","╚═▀▀▀══╝"],
  ".": ["   ","   ","   ","   ","██╗","╚═╝"],
}

const HEIGHT = 6

/** Compose a money string ('$8,749') into 6 lines of ANSI-Shadow art. */
export function composeAnsiArt(value: string): string[] {
  const lines: string[] = Array.from({ length: HEIGHT }, () => '')
  for (const ch of value) {
    const glyph = GLYPHS[ch]
    if (!glyph) continue
    const width = Math.max(...glyph.map((l) => l.length))
    for (let i = 0; i < HEIGHT; i += 1) {
      lines[i] += (glyph[i] ?? '').padEnd(width, ' ') + ' '
    }
  }
  return lines.map((l) => l.replace(/s+$/, ''))
}
