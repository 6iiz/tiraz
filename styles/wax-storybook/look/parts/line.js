// A line as the printed words of a picture book: an optional small grey lead, then the statement, both set in the brand's type and
// written in word by word from the reading side. The key word (*…*) is then coloured over in crayon, a zigzag scribble of the accent
// laid under it, and underlined with a wavy crayon stroke. The page itself turns away at the joint, so the words stay to the end.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, K = M.masks(W, H);
  const maxW = SAFE.right - SAFE.left - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.6, where: 'the lead-in' }) : null;
  const gapL = lead ? 26 : 0, block = (lead ? lead.height + gapL : 0) + line.height;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gapL : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  // the key words' boxes, measured once
  const keys = []; kit.drawText(document.createElement('canvas').getContext('2d'), line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'center',
    each: (w, i, box) => { if (w.key) keys.push({ ...box, i: nLead + i }); return false; } });
  const lastKey = keys.length ? Math.max(...keys.map((k) => k.i)) : nAll - 1;
  const total = lastKey * T.dur.gap + T.dur.word + 0.1 + T.dur.scribble;
  const f = at < 0 ? Math.min(1, (-at - 0.05) / total) : 1;            // an opening line is whole by the first frame
  const tw = (i) => at + i * T.dur.gap * f, tk = (k) => at + (k.i * T.dur.gap + T.dur.word + 0.1) * f;
  const word = (t, base, size) => (w, i, box, c) => M.write(c, span(t, tw(base + i), tw(base + i) + T.dur.word * f), box, size, rtl);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = ground.boil(t);
      for (const k of keys) {
        const p = span(t, tk(k), tk(k) + T.dur.scribble * f); if (p <= 0) continue;
        const s = line.size, x = k.x - s * 0.13, y = k.y - s * 0.5, w = k.width + s * 0.26, h = s * 1.05;
        M.wax(ctx, K.mid, [x - 30, y - 30, w + 60, h + 90], (c) => {
          const blob = new Path2D(); blob.roundRect(x, y, w, h, h * 0.4);
          M.colour(c, blob, [x, y, w, h], P.key, M.E(p), b * 31 + k.i, rtl ? 2.6 : -0.5, 12);
          const u = span(p, 0.55, 1), yy = k.y + s * 0.66, wave = [];
          for (let j = 0; j <= 16; j++) wave.push([rtl ? x + w - (w * j) / 16 : x + (w * j) / 16, yy + Math.sin(j * 1.3) * 5]);
          M.stroke(c, wave, 7, P.deep, b * 17 + k.i, u);
        });
      }
      if (lead) kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'center', color: P.grey, each: word(t, 0, lead.size) });
      kit.drawText(ctx, line, { x0: SAFE.left, x1: SAFE.right, y: yLine, align: 'center', color: P.ink, key: P.ink, each: word(t, nLead, line.size) });
    },
  };
}
