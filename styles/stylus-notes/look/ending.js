// The Stylus Notes ending: the stylus traces the outline of the brand's logo in one glowing line (following the logo's own path, piece
// by piece), then the shape fills in with the brand's light colour as if a fill bucket were tapped inside it, with an accent glow under
// it. The stylus writes the name, the handle in the accent and the slogan, then lifts and hovers. spec: { duration }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, minScale: 1, where: 'the slogan' }) : null;
  const S = 280, lx = W / 2 - S / 2, ly = 330;
  const yName = ly + S + 80 + name.lead / 2, yHandle = yName + name.lead / 2 + 18 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  // the logo's own outline, sampled into pieces (one per sub-path), when the logo is given as a path
  const pieces = [];
  if (brand.logo.path) {
    try {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', brand.logo.path);
      const box = brand.logo.box || 256, k = S / box, len = el.getTotalLength(), n = 700, step = len / n;
      let cur = [];
      for (let i = 0; i <= n; i++) {
        const q = el.getPointAtLength(i * step), pt = [lx + q.x * k, ly + q.y * k], last = cur.at(-1);
        if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) > step * k * 3) { if (cur.length > 1) pieces.push(cur); cur = []; }
        cur.push(pt);
      }
      if (cur.length > 1) pieces.push(cur);
    } catch { pieces.length = 0; }
  }
  const traced = pieces.map((p) => M.stroke(p)), tot = traced.reduce((s, p) => s + p.total, 0) || 1;
  let tt = 0.15; const strokes = traced.map((Sx) => { const dur = 1.0 * Sx.total / tot; const e = { S: Sx, t0: tt, t1: tt + dur }; tt += dur + 0.04; return e; });
  const fillAt = (strokes.at(-1)?.t1 ?? 1.0) + 0.05;
  const nw = M.layout(kit, name, { x0, x1, y: yName, align: 'center' }), ns = M.schedule(nw, fillAt + 0.35, 0.6);
  const hw = M.layout(kit, handle, { x0, x1, y: yHandle, align: 'center' }), hs = M.schedule(hw, ns.at(-1).t1 + 0.1, 0.35);
  const sw = slogan ? M.layout(kit, slogan, { x0, x1, y: ySlogan, align: 'center' }) : [], ss = slogan ? M.schedule(sw, hs.at(-1).t1 + 0.1, 0.55) : [];
  const events = [...strokes, ...nw.map((w, i) => ({ ...ns[i], word: { box: w, size: name.size, rtl } })), ...hw.map((w, i) => ({ ...hs[i], word: { box: w, size: handle.size, rtl } })),
    ...sw.map((w, i) => ({ ...ss[i], word: { box: w, size: slogan.size, rtl } }))];
  const glow = rgba(pal.light, 0.45);
  const ink = (L, sch, size, g) => (w, i, box, c) => M.inkWord(c, span(L, sch[i].t0, sch[i].t1), box, size, rtl, g);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const f = M.E(span(t, fillAt, fillAt + 0.3));
      if (f > 0) {
        ctx.save();
        const g = ctx.createRadialGradient(W / 2, ly + S / 2, 0, W / 2, ly + S / 2, S * 0.95);
        g.addColorStop(0, rgba(pal.accent, 0.3 * f)); g.addColorStop(1, rgba(pal.accent, 0));
        ctx.fillStyle = g; ctx.fillRect(W / 2 - S, ly - S / 2, S * 2, S * 2);
        ctx.globalAlpha = f; brand.logo.draw(ctx, lx, ly, S, pal.light); ctx.restore();
      }
      if (strokes.length) for (const s of strokes) M.ink(ctx, s.S, span(t, s.t0, s.t1), 5, pal.key, pal.accent, 1 - f * 0.6);
      else if (f <= 0) { const p = span(t, 0.15, fillAt); ctx.save(); ctx.beginPath(); ctx.rect(lx, ly, S, S * p); ctx.clip(); brand.logo.draw(ctx, lx, ly, S, pal.light); ctx.restore(); }
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: pal.light, each: ink(t, ns, name.size, glow) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: pal.key, each: ink(t, hs, handle.size, rgba(pal.accent, 0.5)) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: pal.grey, each: ink(t, ss, slogan.size, glow) });
      const pt = M.tipPath(events, t); if (pt) M.tip(ctx, pt, pal, pt.alpha ?? 1);
    },
  };
}
