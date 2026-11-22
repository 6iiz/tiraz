// The assembly-guide ending, the last page of the manual: the finished product's box drops in along its dotted guides in the accent,
// clicks, turns white, and the brand's logo is printed on its side in the same isometric angle. A badge with a tick lands beside it,
// and the name, handle and slogan slide in beneath. While the reel closes, a dotted turn-arrow runs slowly round the box's foot.
// spec: { duration }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 500, maxW, minPx: 44, where: 'the slogan' }) : null;
  const u = 150, w = 1.6, h = 1.3, dd = 1.6, ox = W / 2, oy = 330 + h * u, V = M.view(ox, oy, u);
  const yName = oy + (w + dd) * M.S30 * u + 60 + name.lead / 2, yHandle = yName + name.lead / 2 + 6 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const tDrop = 0.15, tLogo = 1.35, tBadge = 1.6, tName = 1.8;
  const L = Math.min(dd, h) * 0.62, offU = (dd - L) / 2, offV = (h - L) / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const p = M.clamp((t - tDrop) / 0.5), fit = M.clamp((t - tDrop - 0.85) / 0.3);
      // the turn arrow round the foot, marching slowly
      const pa = M.clamp((t - 2.2) / 0.6);
      if (pa > 0) {
        const [cx, cy] = V(w / 2, 0, dd / 2), rx = (w + dd) * M.C30 * u * 0.68, ry = rx * M.S30 / M.C30;
        ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 12]); ctx.lineDashOffset = -t * 18;
        ctx.beginPath(); ctx.ellipse(cx, cy + 20, rx, ry, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        const a = 0.85 * Math.PI, ex = cx + Math.cos(a) * rx, ey = cy + 20 + Math.sin(a) * ry;
        ctx.setLineDash([]); ctx.fillStyle = K.ink; ctx.beginPath(); ctx.moveTo(ex - 6, ey - 16); ctx.lineTo(ex - 22, ey + 4); ctx.lineTo(ex + 4, ey + 8); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (p > 0) {
        const lift = (1 - M.E(p)) * 2.4;
        if (p < 1) for (const [gx, gz] of [[0, dd], [w, dd], [w, 0]]) { const [a1, b1] = V(gx, h + lift, gz), [a2, b2] = V(gx, h + 4, gz); M.dotted(ctx, a1, b1, a2, b2, K.ink, 0.6); }
        M.box(ctx, V, 0, lift, 0, w, h, dd, M.fills(K, fit), 4);
        const [lx, ly] = V(w, 0, dd * 0.5); M.click(ctx, lx + 10, ly - 10, (t - tDrop - 0.5) / 0.6, K.ink, 1, 30);
        const pl = M.clamp((t - tLogo) / 0.35);
        if (pl > 0 && lift === 0) {
          const [X, Y] = V(w, h, dd);
          ctx.save(); ctx.transform(M.C30, -M.S30, 0, 1, X, Y); ctx.globalAlpha = pl;
          brand.logo.draw(ctx, offU * u, offV * u, L * u, K.ink); ctx.restore();
        }
      }
      const pb = M.clamp((t - tBadge) / 0.3);
      if (pb > 0) {
        const [bx, by] = V(w, h + 0.55, 0), r = 40 * M.E(pb);
        ctx.save(); ctx.fillStyle = K.accent; ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx + 40, by, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (pb >= 1) { ctx.strokeStyle = K.onAccent; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(bx + 24, by); ctx.lineTo(bx + 36, by + 13); ctx.lineTo(bx + 58, by - 13); ctx.stroke(); }
        ctx.restore();
      }
      const slide = (t0, size) => (wd, i, b, c) => M.arrive(c, (t - t0 - i * 0.06) / 0.35, rtl, size);
      kit.drawText(ctx, name, { x0, x1, y: yName, align: 'center', color: K.ink, each: slide(tName, name.size) });
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, align: 'center', color: K.grey, each: slide(tName + 0.25, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, align: 'center', color: K.grey, each: slide(tName + 0.4, slogan.size) });
    },
  };
}
