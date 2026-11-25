// A line: the lead on a small plate and the line on a big board, both hung on the back wall of the little room. Each lets go of
// its hook in turn, falls flat against the wall, knocks and settles; the key words sit on an accent plaque printed on the board.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; the joint covers the leaving)
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 + Math.round(clock) });
  const rg = R3.region, pad = 2 * T.sign.padX;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW: rg.w - pad, minScale: 0.7, lead: 1.32, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 600, maxW: rg.w - pad - 40, minScale: 0.88, lead: 1.3, where: 'the lead-in' }) : null;
  const bl = R3.boardSize(line), bd = lead ? R3.boardSize(lead) : null;
  const ys = R3.stack([...(lead ? [bd.h] : []), bl.h], spec.y ?? T.layout.centre);
  const plain = (f) => f.rows.map((r) => r.words.map((w) => w.w).join(' ')).join(' ');
  const signs = [];
  if (lead) signs.push({ s: R3.sign({ cx: rg.cx, cy: ys[0], wpx: bd.w, hpx: bd.h, depth: 12, paint: R3.textPaint(lead, {}), text: plain(lead) }), t0: at });
  signs.push({ s: R3.sign({ cx: rg.cx, cy: ys.at(-1), wpx: bl.w, hpx: bl.h, paint: R3.textPaint(line, {}), text: plain(line) }), t0: at + (lead ? T.dur.step : 0) });
  return {
    duration: d,
    draw(ctx, t) {
      signs.forEach(({ s, t0 }) => s.pose(t, t0));
      R3.draw(ctx, t);
      signs.forEach(({ s }) => s.rec());
    },
  };
}
