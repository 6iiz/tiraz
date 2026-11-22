// A line as a news item: the picture panel runs a shot (a skyline, a map with a route, a street at night: chosen by where the scene
// sits in the reel), the lead-in is the category on the accent tab, and the statement rolls up onto the ink strap of the lower third.
// The key word (*…*) gets a highlight chip of the accent wiped in behind it. spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const textW = SAFE.right - SAFE.left - T.strap.end - 66;
  const text = kit.fit(spec.says.text, { size: T.size.strap, weight: T.weight.strap, maxW: textW, minScale: 0.7 });
  const tab = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.tab, weight: T.weight.tab, maxW: SAFE.right - SAFE.left - 64 - T.tab.slant, single: true, where: 'the lead-in' }) : null;
  const pic = M.picture(P, T, W, Math.floor(clock / 3));
  const st = M.strap({ kit, brand, P, T, tab, text });
  const D = T.dur;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      pic.draw(ctx, t - at);
      st.draw(ctx, {
        pTab: span(t, at, at + D.tab), pText: span(t, at + 0.15, at + 0.15 + D.flip), pKey: span(t, at + 0.55, at + 0.55 + D.chip),
        out: span(t, d - D.fold, d),
      });
    },
  };
}
