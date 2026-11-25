// A line, printed on price tags threaded on one cord above the turntable: the lead on a small tag in grey print, then one tag per
// row of the line. The tags swing round the cord from behind, top first, and settle square to the lens; the key words sit on an
// accent sticker. When the line is done they are swung back round, top first. The turntable below keeps turning the product.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted; this style always leaves by swinging the tags away)
import { need } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, fam = brand.fonts.display.family;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 1 });
  await W3.fonts([[T.weight.line, T.size.line, fam], [T.weight.lead, T.size.lead, fam]]);
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: W3.textMax - 2 * T.tag.keyPad, minScale: 0.62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: W3.textMax, minScale: 0.88, where: 'the lead-in' }) : null;
  const tags = [];
  if (lead) for (const r of lead.rows) tags.push(W3.textTag(r, lead, { color: W3.tone.grey, high: T.high.lead }));
  for (const r of line.rows) tags.push(W3.textTag(r, line, { high: T.high.line }));
  W3.hang(tags, { centre: spec.y ?? 690 });
  const n = tags.length, st = Math.min(T.dur.stagger, (0.8 - T.dur.swing - 0.02) / Math.max(1, n - 1));
  const plan = tags.map((tg, k) => ({ t0: at + 0.02 + k * st, out0: d - T.dur.out - (n - 1 - k) * 0.05 }));
  return {
    duration: d,
    draw(ctx, t) {
      tags.forEach((tg, k) => W3.swing(tg, t, plan[k]));
      W3.draw(ctx, t);
    },
  };
}
