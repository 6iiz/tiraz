// Before and after, explained by hand: the stylus writes the old value in grey, scribbles it out with a glowing accent zigzag, draws a
// curved arrow down to the empty space below, writes the new value in the accent and lassos it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba, mix, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 700, maxW: maxW - 160, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the compare label' }) : null;
  const yLabel = 430, yWas = yLabel + (label ? label.height : 0) + 30 + was.lead / 2, yNow = yWas + was.height + 150;
  const lw = label ? M.layout(kit, label, { x0, x1, y: yLabel }) : [], ww = M.layout(kit, was, { x0, x1, y: yWas }), nw = M.layout(kit, now, { x0, x1, y: yNow });
  const ls = label ? M.schedule(lw, at, Math.min(0.6, 0.15 + 0.1 * lw.length)) : [], wStart = label ? ls.at(-1).t1 + 0.1 : at;
  const wsch = M.schedule(ww, wStart, Math.min(0.5, 0.15 + 0.12 * ww.length));
  const ext = (L) => ({ a: Math.min(...L.map((w) => w.x)), b: Math.max(...L.map((w) => w.x + w.width)) });
  const we = ext(ww), ne = ext(nw);
  const scr = { S: M.scribble(we.a - 10, we.b + 10, yWas, was.size, 5), t0: at + 0.95 }; scr.t1 = scr.t0 + 0.3;
  if (!rtl) scr.S = M.stroke([...scr.S.pts].reverse());
    const arr = { S: M.arrow(rtl ? we.a + (we.b - we.a) * 0.25 : we.b - (we.b - we.a) * 0.25, yWas + was.size * 0.5, rtl ? ne.a - 64 : ne.b + 64, yNow, rtl ? -110 : 110), t0: scr.t1 + 0.06 }; arr.t1 = arr.t0 + 0.24;
  const nsch = M.schedule(nw, arr.t1 + 0.06, Math.min(0.5, 0.15 + 0.12 * nw.length));
  const loop = { S: M.lasso({ x0: ne.a, x1: ne.b, y: yNow, size: now.size }, 23, rtl), t0: nsch.at(-1).t1 + 0.05 }; loop.t1 = loop.t0 + T.dur.lasso;
  const events = [...lw.map((w, i) => ({ ...ls[i], word: { box: w, size: label.size, rtl } })), ...ww.map((w, i) => ({ ...wsch[i], word: { box: w, size: was.size, rtl } })),
    scr, arr, ...nw.map((w, i) => ({ ...nsch[i], word: { box: w, size: now.size, rtl } })), loop];
  const glow = rgba(pal.light, 0.45), keyGlow = rgba(pal.accent, 0.55);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey, key: pal.key, each: (w, i, box, c) => M.inkWord(c, span(t, ls[i].t0, ls[i].t1), box, label.size, rtl, glow) });
      const dim = M.E(span(t, scr.t0, scr.t1));
      const wc = mix(pal.grey, pal.dark, dim * 0.35);
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: wc, key: wc, each: (w, i, box, c) => M.inkWord(c, span(t, wsch[i].t0, wsch[i].t1), box, was.size, rtl, glow) });
      M.ink(ctx, scr.S, span(t, scr.t0, scr.t1), T.pen.mark, pal.key, pal.accent);
      M.ink(ctx, arr.S, span(t, arr.t0, arr.t1), 5, pal.grey, pal.light);
      M.ink(ctx, loop.S, span(t, loop.t0, loop.t1), T.pen.lasso, pal.key, pal.accent);
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key, each: (w, i, box, c) => M.inkWord(c, span(t, nsch[i].t0, nsch[i].t1), box, now.size, rtl, keyGlow) });
      const pt = M.tipPath(events, t); if (pt) M.tip(ctx, pt, pal, pt.alpha ?? 1);
    },
  };
}
