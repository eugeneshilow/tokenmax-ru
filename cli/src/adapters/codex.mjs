// Codex adapter.
//
// Reads ~/.codex/sessions/**/*.jsonl and ~/.codex/archived_sessions/*.jsonl.
// Each line is a JSON event with { timestamp, type, payload }.
//
// Usage events look like:
//   { type:'event_msg', payload:{ type:'token_count', info:{
//       total_token_usage:{...cumulative...},
//       last_token_usage:{ input_tokens, cached_input_tokens, output_tokens,
//                          reasoning_output_tokens, total_tokens } } } }
// `last_token_usage` is the per-turn DELTA; summing the deltas across a session
// equals the final `total_token_usage` (verified on real logs), so deltas give
// correct per-day buckets with no double counting.
//
// Codex accounting nests its buckets: input_tokens INCLUDES cached_input_tokens,
// and output_tokens INCLUDES reasoning_output_tokens (input + output ==
// total_tokens). The leaderboard server treats input/output/cacheCreate/
// cacheRead/reasoning as DISJOINT additive buckets, so we split them:
//   cacheRead = cached_input_tokens
//   input     = input_tokens  - cached_input_tokens
//   reasoning = reasoning_output_tokens
//   output    = output_tokens - reasoning_output_tokens
//   cacheCreate = 0  (Codex does not report cache creation separately)
//
// The model id is not on the token_count event; it is declared on `turn_context`
// (payload.model) and `session_meta`, which precede the turn's usage. We track
// the most recent model id and attribute usage to it.
//
// SAFETY INVARIANT: this module never reads, stores, or transmits prompt text,
// tool output, file contents, or keys — only token integers, the model id, and
// the day.

import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { num, isoDay, walkJsonl, lines } from '../util.mjs';

const DEFAULT_MODEL = 'gpt-5.5';

/**
 * @returns {Promise<{ tool:'codex', sessionCount:number, records:Array }>}
 */
export async function scanCodex() {
  const home = os.homedir();
  const dirs = [
    path.join(home, '.codex', 'sessions'),
    path.join(home, '.codex', 'archived_sessions'),
  ];

  const records = [];
  let sessionCount = 0;

  for (const dir of dirs) {
    for await (const file of walkJsonl(dir)) {
      let text;
      try {
        text = await readFile(file, 'utf8');
      } catch {
        continue;
      }
      sessionCount++;

      let curModel = DEFAULT_MODEL;
      for (const line of lines(text)) {
        let d;
        try {
          d = JSON.parse(line);
        } catch {
          continue;
        }
        const p = (d && d.payload) || {};

        // Track the active model from whichever event last declared one.
        if (typeof p.model === 'string' && p.model) {
          curModel = p.model;
        } else if (
          p.collaboration_mode &&
          p.collaboration_mode.settings &&
          typeof p.collaboration_mode.settings.model === 'string' &&
          p.collaboration_mode.settings.model
        ) {
          curModel = p.collaboration_mode.settings.model;
        }

        if (p.type !== 'token_count') continue;
        const info = p.info || {};
        const lt = info.last_token_usage;
        if (!lt) continue;

        const date = isoDay(d.timestamp);
        if (!date) continue;

        const inTok = num(lt.input_tokens);
        const cached = num(lt.cached_input_tokens);
        const outTok = num(lt.output_tokens);
        const reasoning = num(lt.reasoning_output_tokens);

        records.push({
          tool: 'codex',
          model: curModel,
          date,
          input: Math.max(0, inTok - cached),
          output: Math.max(0, outTok - reasoning),
          cacheCreate: 0,
          cacheRead: cached,
          reasoning,
        });
      }
    }
  }

  return { tool: 'codex', sessionCount, records };
}
