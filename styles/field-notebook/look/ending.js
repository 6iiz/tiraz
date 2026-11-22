// The field-notebook ending: the brand drawn as the plate's specimen. A pencil circle is traced, the logo's contour is drawn around it
// (the line travels round the centre), and the logo is hatched in with the coloured pencil from the top down; then the name is written
// in graphite and underlined, the handle in the mono face, the slogan in the soft pencil. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.line, maxW: full - 40, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW: full - 40, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW: full - 40, single: true, where: 'the slogan' }) : null;
  const S = 260, cx = W / 2, cy = 470, x0 = cx - S / 2, y0 = cy - S / 2;
  // the logo, hatched and outlined, baked once
  const mk = () => { const c = document.createElement('canvas'); c.width = S + 40; c.height = S + 40; return c; };
  const solid = mk(), sg = solid.getContext('2d'); brand.logo.draw(sg, 20, 20, S, P.graphite);
  const line = mk(), lg = line.getContext('2d');
  for (let a = 0; a < 6.28; a += 0.4) lg.drawImage(solid, Math.cos(a) * 3, Math.sin(a) * 3);
  lg.globalCompositeOperation = 'destination-out'; lg.drawImage(solid, 0, 0);
  const fill = mk(), fg = fill.getContext('2d');
  fg.globalAlpha = 0.25; fg.drawImage(solid, 0, 0); fg.globalAlpha = 1;
  fg.drawImage(M.hatchCanvas(S + 40, S + 40, P.pen, { angle: -0.9, gap: 4, len: 30, seed: 900 }), 0, 0);
  fg.drawImage(M.hatchCanvas(S + 40, S + 40, P.pen, { angle: 0.6, gap: 7, len: 26, seed: 901 }), 0, 0);
  fg.globalCompositeOperation = 'destination-in'; fg.drawImage(solid, 0, 0);
  const ring = [], R = S * 0.78; for (let i = 0; i <= 48; i++) { const a = -Math.PI / 2 + (i / 48) * 6.4 * (rtl ? -1 : 1); ring.push([cx + Math.cos(a) * (R + Math.sin(i) * 2), cy + Math.sin(a) * (R + Math.cos(i * 1.3) * 2)]); }
  const yName = cy + R + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 10 + (slogan ? slogan.lead / 2 : 0);
  const sn = M.schedule(name, 1.15, T.write.line), sh = M.schedule(handle, sn.end + 0.3, 1400), ss = slogan ? M.schedule(slogan, sh.end + 0.1, T.write.lead) : null;
  const under = M.wobble([cx + name.width / 2 + 10, yName + name.size * 0.62], [cx - name.width / 2 - 10, yName + name.size * 0.6], 950, 2.5);
  if (!rtl) under.reverse();
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.pencil(ctx, ring, span(t, 0.05, 0.55), P.soft, 2.2);
      const po = span(t, 0.3, 0.85);
      if (po > 0) {                                                       // the contour, drawn round the centre
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); const a0 = -Math.PI / 2; ctx.arc(cx, cy, S, a0, a0 + po * 6.29 * (rtl ? -1 : 1), rtl); ctx.closePath(); ctx.clip();
        ctx.drawImage(line, x0 - 20, y0 - 20); ctx.restore();
      }
      const ph = span(t, 0.6, 1.2);
      if (ph > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20, y0 - 20, S + 40, (S + 40) * ph); ctx.clip(); ctx.drawImage(fill, x0 - 20, y0 - 20); ctx.restore(); }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.graphite, each: (w, k, box, c) => M.write(c, t, sn.at(k), box, name.size, rtl) });
      M.pencil(ctx, under, span(t, sn.end, sn.end + 0.3), P.pen, 4);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.soft, each: (w, k, box, c) => M.write(c, t, sh.at(k), box, handle.size, false) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.soft, each: (w, k, box, c) => M.write(c, t, ss.at(k), box, slogan.size, rtl) });
    },
  };
}
