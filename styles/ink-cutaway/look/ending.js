// The Ink Cutaway ending: a title block is ruled on the sheet, cell by cell. In the big cell the brand's logo is drawn the way a part
// is: outline first, then section hatching, then solid ink; the accent path comes in from the margin and ends on it with an arrow.
// The name is inked into the cell below, the handle in the mono face, and the slogan in grey in the last cell. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const bx0 = 110, bx1 = W - 110, inner = bx1 - bx0 - 60;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: inner, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW: inner, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' · '), { size: T.size.slogan, weight: 500, maxW: inner, minScale: 0.9, minPx: 40, where: 'the slogan' }) : null;
  const yA = 300, yB = 700, yC = yB + name.lead + 30, yD = yC + handle.lead + 24, yE = slogan ? yD + slogan.lead + 24 : yD;
  const ls = 300, lx = W / 2 - ls / 2, ly = (yA + yB) / 2 - ls / 2;
  const logoPath = brand.logo.path ? new Path2D(brand.logo.path) : null, box = brand.logo.box || 256, rule = brand.logo.rule || 'nonzero';
  const rules = [[[bx0, yA], [bx1, yA]], [[bx1, yA], [bx1, yE]], [[bx1, yE], [bx0, yE]], [[bx0, yE], [bx0, yA]], [[bx0, yB], [bx1, yB]], [[bx0, yC], [bx1, yC]], ...(slogan ? [[[bx0, yD], [bx1, yD]]] : [])];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      rules.forEach((seg, i) => M.stroke(ctx, seg, M.soft(span(t, 0.05 + i * 0.07, 0.4 + i * 0.07)), { color: pal.ink, width: i < 4 ? 3 : 1.5 }));
      // the logo: outline, hatching, then solid
      ctx.save(); ctx.translate(lx, ly); ctx.scale(ls / box, ls / box);
      const ow = span(t, 0.45, 1.05), hw = span(t, 0.95, 1.4), solid = M.soft(span(t, 1.45, 1.75));
      if (logoPath) {
        if (ow > 0) { ctx.save(); ctx.beginPath(); ctx.rect(-10, -10, box + 20, (box + 20) * ow); ctx.clip(); ctx.strokeStyle = pal.ink; ctx.lineWidth = 3 * box / ls; ctx.stroke(logoPath); ctx.restore(); }
        if (hw > 0) { ctx.save(); ctx.clip(logoPath, rule); ctx.beginPath(); ctx.rect(-10, -10, box + 20, (box + 20) * hw); ctx.clip(); M.hatch(ctx, 0, 0, box, box, 9 * box / ls, pal.ink, 1.6 * box / ls); ctx.restore(); }
        if (solid > 0) { ctx.save(); ctx.globalAlpha = solid; ctx.fillStyle = pal.ink; ctx.fill(logoPath, rule); ctx.restore(); }
      }
      ctx.restore();
      if (!logoPath && ow > 0) { ctx.save(); ctx.beginPath(); ctx.rect(lx, ly, ls, ls * ow); ctx.clip(); brand.logo.draw(ctx, lx, ly, ls, pal.ink); ctx.restore(); }
      // the path arrives at the logo
      const yl = ly + ls / 2, xs = rtl ? bx1 + 60 : bx0 - 60, xe = rtl ? lx + ls + 24 : lx - 24;
      const r = M.stroke(ctx, [[xs, yl], [xe, yl]], M.soft(span(t, 1.2, 1.7)), { color: pal.path, width: 5 });
      if (r && span(t, 1.2, 1.7) >= 1) M.arrowHead(ctx, xe, yl, rtl ? Math.PI : 0, 22, pal.path);
      const ink = (t0, f) => (w, i, b, c) => { if (M.inked(c, t, t0 + i * 0.06, 0.25, d + 1, d + 2, b, f.size, rtl) === false) return false; };
      kit.drawText(ctx, name, { x0: bx0 + 30, x1: bx1 - 30, y: yB + 15 + name.lead / 2, align: 'center', color: pal.ink, each: ink(1.6, name) });
      kit.drawText(ctx, handle, { x0: bx0 + 30, x1: bx1 - 30, y: yC + 12 + handle.lead / 2, align: 'center', color: pal.ink, each: ink(1.95, handle) });
      if (slogan) kit.drawText(ctx, slogan, { x0: bx0 + 30, x1: bx1 - 30, y: yD + 12 + slogan.lead / 2, align: 'center', color: pal.grey, each: ink(2.2, slogan) });
    },
  };
}
