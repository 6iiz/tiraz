// The Frame Forensics ending: every kind of evidence is pulled into one map. Four small sources (a camera frame, a page with one line
// highlighted, a data trace, a sound wave) slide in to the corners, each with its timecode; leaders are drawn from all four to one node
// in the middle, which closes with corner brackets around the brand's logo. Then the name, the handle and the slogan are set below.
// spec: { duration }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 700, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minScale: 0.9, where: 'the slogan' }) : null;
  const F = M.footage(T.frame.w, T.frame.h, P, 23);
  const tw = 250, th = 150, cx = W / 2, cy = 600, S = 230;
  const tiles = [
    { x: SAFE.left, y: 340, kind: 'cam', code: '14:07:32' }, { x: SAFE.right - tw, y: 340, kind: 'doc', code: '14:09:05' },
    { x: SAFE.left, y: 740, kind: 'trace', code: '14:11:40' }, { x: SAFE.right - tw, y: 740, kind: 'wave', code: '14:12:18' }];
  const r = rng(31), wave = Array.from({ length: 34 }, () => 0.15 + r() * 0.85), trace = Array.from({ length: 30 }, (_, i) => 0.2 + 0.5 * Math.abs(Math.sin(i * 0.5 + r())) + (i > 24 ? 0.25 : 0));
  const yName = cy + S / 2 + 290, yHandle = yName + name.lead / 2 + 12 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const drawTile = (ctx, k, x, y) => {
    const tl = tiles[k];
    ctx.fillStyle = P.panel; ctx.fillRect(x, y, tw, th); ctx.strokeStyle = P.rule; ctx.lineWidth = 2; ctx.strokeRect(x, y, tw, th);
    if (tl.kind === 'cam') { ctx.save(); ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.clip(); ctx.drawImage(F.base, x - 40, y - 10, tw * 1.45, tw * 1.45 * F.h / F.w); ctx.restore(); }
    if (tl.kind === 'doc') for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 3 ? P.accent : P.dim; ctx.fillRect(x + 22, y + 22 + i * 19, (tw - 44) * (i === 5 ? 0.5 : 0.92 - (i % 2) * 0.12), i === 3 ? 12 : 6); }
    if (tl.kind === 'trace') { ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.beginPath(); trace.forEach((v, i) => { const xx = x + 16 + (tw - 32) * i / (trace.length - 1), yy = y + th - 18 - (th - 36) * v; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }); ctx.stroke(); }
    if (tl.kind === 'wave') wave.forEach((v, i) => { const xx = x + 16 + (tw - 32) * i / wave.length, hh = (th - 40) * v; ctx.fillStyle = i === 22 ? P.accent : P.ink; ctx.fillRect(xx, y + th / 2 - hh / 2, 4, hh); });
    M.code(ctx, tl.code, x + tw / 2, y + th + 24, { mono, size: 20, color: P.grey, align: 'center' });
  };
  const set = (t, t0, size, out = 0) => (w, i, box, c) => { const s0 = t0 + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, size) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      tiles.forEach((tl, k) => {
        const p = M.E(span(t, 0.05 + k * 0.12, 0.5 + k * 0.12)); if (p <= 0) return;
        const fromX = tl.x < cx ? -tw - 40 : W + 40, x = fromX + (tl.x - fromX) * p;
        drawTile(ctx, k, x, tl.y);
        const lp = span(t, 0.75 + k * 0.06, 1.1 + k * 0.06);
        const ex = tl.x < cx ? tl.x + tw : tl.x, ey = tl.y + th / 2, nx = cx + (tl.x < cx ? -S / 2 - 16 : S / 2 + 16), ny = cy + (tl.y < cy ? -S / 4 : S / 4);
        if (lp > 0) {
          ctx.save(); ctx.strokeStyle = P.mark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex, ey);
          const mx = ex + (nx - ex) * 0.5, q = Math.min(1, lp * 2), q2 = Math.max(0, lp * 2 - 1);
          ctx.lineTo(ex + (mx - ex) * q, ey); if (q2 > 0) { ctx.lineTo(mx, ey + (ny - ey) * q2); ctx.lineTo(mx + (nx - mx) * q2, ey + (ny - ey) * q2); }
          ctx.stroke(); if (lp >= 1) { ctx.fillStyle = P.mark; ctx.beginPath(); ctx.arc(nx, ny, 5, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        }
      });
      // the node: brackets close, the logo is set in it
      const np = M.E(span(t, 1.1, 1.45));
      if (np > 0) {
        ctx.fillStyle = P.panel; ctx.fillRect(cx - S / 2, cy - S / 2, S, S);
        M.brackets(ctx, cx - S / 2 - 10, cy - S / 2 - 10, S + 20, S + 20, np, P.mark, 46, 4);
        const lg = span(t, 1.3, 1.5); if (lg > 0) { ctx.save(); ctx.globalAlpha = lg; brand.logo.draw(ctx, cx - S * 0.32, cy - S * 0.32, S * 0.64, P.ink); ctx.restore(); }
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.ink, each: set(t, 1.55, name.size) });
      const rw = Math.min(maxW, name.width + 40) * M.E(span(t, 1.75, 2.05)); ctx.fillStyle = P.mark; ctx.fillRect(cx - rw / 2, yName + name.lead / 2 - 6, rw, 3);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.ink, each: set(t, 1.9, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.grey, each: set(t, 2.1, slogan.size) });
    },
  };
}
