// The manuscript ending: a colophon. A four-lobed medallion is outlined in ink and gilded square by square; a vellum roundel is
// painted at its heart and the logo is painted into it in ink; a light then crosses the leaf. The name is written on a forked ribbon
// under it, and the handle and the slogan on a small vellum panel below, the slogan in red-letter ink. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, rtl = kit.rtl;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: SAFE.right - SAFE.left - 200, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 600, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the slogan' }) : null;
  const my = 500, lobe = 118, off = 112, disc = 150;
  const quatre = (c, k = 0) => { c.beginPath(); for (const [dx, dy] of [[0, -off], [off, 0], [0, off], [-off, 0]]) { c.moveTo(cx + dx + lobe + k, my + dy); c.arc(cx + dx, my + dy, lobe + k, 0, Math.PI * 2); } };
  const gild = M.leaf(cx - off - lobe, my - off - lobe, (off + lobe) * 2, (off + lobe) * 2, pal, 808, 20);
  const rh = name.lead + 30, yName = my + off + lobe + 70 + rh / 2;
  const ph = handle.lead + (slogan ? slogan.lead : 0) + 60, pw = Math.min(SAFE.right - SAFE.left, Math.max(handle.width, slogan ? slogan.width : 0) + 140);
  const py = yName + rh / 2 + 44, yH = py + 30 + handle.lead / 2, yS = yH + handle.lead / 2 + (slogan ? slogan.lead / 2 : 0);
  const seq = (f, o, t0) => { let tt = t0; return M.boxesOf(kit, f, o).map((b) => { const a = tt; tt += b.width / T.pen + 0.04; return [a, a + b.width / T.pen]; }); };
  const no = { x0: cx - name.width / 2, x1: cx + name.width / 2, y: yName, align: 'center' };
  const ho = { x0: SAFE.left, x1: SAFE.right, y: yH, align: 'center' }, so = { x0: SAFE.left, x1: SAFE.right, y: yS, align: 'center' };
  const nW = seq(name, no, 1.45), hW = seq(handle, ho, nW.at(-1)[1] + 0.15), sW = slogan ? seq(slogan, so, hW.at(-1)[1] + 0.1) : [];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, light = ground.light(time + 2);
      const po = span(t, 0, 0.45);
      if (po > 0) {
        const lf = span(t, 0.25, 1.0);
        if (lf > 0) {
          ctx.save(); quatre(ctx); ctx.clip();
          gild.draw(ctx, lf, M.sweep(gild.x, gild.x + gild.w, span(t, 1.3, 2.3), rtl, light));
          ctx.restore();
        }
        ctx.save(); quatre(ctx); ctx.strokeStyle = pal.ink; ctx.lineWidth = 6; if (po < 1) ctx.setLineDash([3000 * M.S(po), 6000]); ctx.stroke(); ctx.restore();
      }
      M.painted(ctx, span(t, 0.6, 1.1), (c) => { c.beginPath(); c.arc(cx, my, disc, 0, Math.PI * 2); }, Math.PI * 2 * disc, pal,
        { pearls: Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return [cx + Math.cos(a) * (disc - 16), my + Math.sin(a) * (disc - 16)]; }), weight: 5 });
      const pl = span(t, 1.0, 1.4);                                       // the logo is painted in, top to bottom
      if (pl > 0) { const s = 170; ctx.save(); ctx.beginPath(); ctx.rect(cx - s / 2 - 4, my - s / 2 - 4, s + 8, (s + 8) * M.S(pl)); ctx.clip(); brand.logo.draw(ctx, cx - s / 2, my - s / 2, s, pal.ink); ctx.restore(); }
      M.painted(ctx, span(t, 1.15, 1.6), (c) => M.ribbonPath(c, cx, yName, name.width + 90, rh), (name.width + rh) * 2 + 200, pal, { weight: 4 });
      kit.drawText(ctx, name, { ...no, color: pal.ink, each: (w, i, box, c) => M.pen(c, span(t, nW[i][0], nW[i][1]), box, name.size, rtl) });
      M.painted(ctx, span(t, hW[0][0] - 0.3, hW[0][0] + 0.2), (c) => M.panelPath(c, cx - pw / 2, py, pw, ph, 22), (pw + ph) * 2, pal,
        { inset: (c) => M.panelPath(c, cx - pw / 2 + 10, py + 10, pw - 20, ph - 20, 14) });
      kit.drawText(ctx, handle, { ...ho, color: pal.ink, each: (w, i, box, c) => M.pen(c, span(t, hW[i][0], hW[i][1]), box, handle.size, false) });
      if (slogan) kit.drawText(ctx, slogan, { ...so, color: pal.rubric, each: (w, i, box, c) => M.pen(c, span(t, sW[i][0], sW[i][1]), box, slogan.size, rtl) });
    },
  };
}
