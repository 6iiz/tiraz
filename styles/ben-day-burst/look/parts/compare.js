// Before and after as two pulls of the same print. The old one is pulled faded (paper, pale tint, no colourway) with the old value
// in grey under it; a heavy key bar is printed through the value. Then the same object is pulled beside it in full colour and the new
// value is printed on an accent block with a key border. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE, mix, contrast } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, g = T.gutter;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 60;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.88, where: 'the compare label' }) : null;
  const block = (label ? label.height + 16 : 0) + was.height + 30 + now.height + 20;
  const top = Math.max(620, kit.place(block, 1020));
  const tw = (W - 80 - g) / 2, th = top - 40 - 40, s = Math.min(tw, th) / 240;
  const rWas = { x: rtl ? 40 + tw + g : 40, y: 40, w: tw, h: th }, rNow = { x: rtl ? 40 : 40 + tw + g, y: 40, w: tw, h: th };
  const yLabel = top + (label ? label.lead / 2 : 0), yWas = top + (label ? label.height + 16 : 0) + was.lead / 2, yNow = yWas + was.height / 2 + 30 + now.lead / 2;
  let k = 0.55, grey = mix(P.night, P.paper, k); while (k > 0 && contrast(grey, P.paper) < 4.6) { k -= 0.04; grey = mix(P.night, P.paper, k); }
  const obj = M.OBJECTS.heart, tCut = at + 0.8, tNow = at + 1.2;
  const nowText = '*' + asText(S.now).split(/\s+/).join(' ') + '*';
  const nowF = kit.fit(nowText, { size: now.size, weight: 900, maxW, minScale: 1, where: 'a compared value' });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = { t, rtl, dots: ground.dots, keyC: P.night, paperC: P.paper, obj, s, step: T.dur.step, plate: T.dur.plate };
      M.printTile(ctx, rWas, P.faded, { ...o, t0: at, ox: rWas.x + tw / 2, oy: rWas.y + th / 2, keyC: grey });
      M.printTile(ctx, rNow, P.ways[0], { ...o, t0: tNow - 0.1, ox: rNow.x + tw / 2, oy: rNow.y + th / 2 });
      if (label) M.pullText(ctx, kit, label, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yLabel, t, t0: at + 0.1, d: T.dur.pull, P, color: P.onAccent, slab: P.accent });
      M.pullText(ctx, kit, was, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yWas, t, t0: at + 0.25, d: T.dur.pull, P, color: grey });
      const pc = M.E(span(t, tCut, tCut + 0.2));
      if (pc > 0) { const ww = was.rows[0].width + 40, w = ww * pc; ctx.fillStyle = P.night; ctx.fillRect(rtl ? SAFE.right - 10 - w : SAFE.left + 10, yWas - 7, w, 14); }
      M.pullText(ctx, kit, nowF, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yNow, t, t0: tNow, d: T.dur.pull, P });
    },
  };
}
