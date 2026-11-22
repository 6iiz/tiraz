// The felt-tip ending, the last sheet: the logo's outline is traced in black round its centre, then coloured in with the broad side of
// the coloured marker (a zigzag, clipped to the logo); the name is lettered big and underlined, the handle lettered in the mono face,
// the slogan in the grey marker. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left;
  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.line, maxW: full - 40, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: full - 40, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW: full - 40, single: true, where: 'the slogan' }) : null;
  const S = 280, cx = W / 2, cy = 480, x0 = cx - S / 2, y0 = cy - S / 2, pad = 24;
  const mk = () => { const c = document.createElement('canvas'); c.width = S + pad * 2; c.height = S + pad * 2; return c; };
  const solid = mk(), sg = solid.getContext('2d'); brand.logo.draw(sg, pad, pad, S, P.ink);
  const line = mk(), lg = line.getContext('2d');                    // the outline: the logo grown a few px, minus the logo
  for (let a = 0; a < 6.28; a += 0.35) lg.drawImage(solid, Math.cos(a) * 5, Math.sin(a) * 5);
  lg.globalCompositeOperation = 'destination-out'; lg.drawImage(solid, 0, 0);
  const zig = M.fillIn(pad - 10, pad - 10, S + pad + 10, S + pad + 10, T.pen.fill * 1.4, rtl, 777);
  const yName = cy + S / 2 + 90 + name.lead / 2, yHandle = yName + name.lead / 2 + 36 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 12 + (slogan ? slogan.lead / 2 : 0);
  const sn = M.schedule(name, 1.15, T.write.line), sh = M.schedule(handle, sn.end + 0.3, 2400), ss = slogan ? M.schedule(slogan, sh.end + 0.1, T.write.lead) : null;
  const under = M.hand([cx + (rtl ? 1 : -1) * (name.width / 2 + 10), yName + name.size * 0.62], [cx - (rtl ? 1 : -1) * (name.width / 2 + 20), yName + name.size * 0.58], 950, 3);
  const fill = mk(), fg = fill.getContext('2d');
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pf = span(t, 0.55, 1.0);
      if (pf > 0) {                                                      // coloured in, clipped to the logo
        fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, fill.width, fill.height);
        M.marker(fg, zig, pf, P.pen, T.pen.fill * 1.4);
        fg.globalCompositeOperation = 'destination-in'; fg.drawImage(solid, 0, 0);
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(fill, x0 - pad, y0 - pad); ctx.restore();
      }
      const po = span(t, 0.05, 0.55);
      if (po > 0) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy); const a0 = -Math.PI / 2; ctx.arc(cx, cy, S, a0, a0 + po * 6.29 * (rtl ? -1 : 1), rtl); ctx.closePath(); ctx.clip();
        ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(line, x0 - pad, y0 - pad); ctx.restore();
      }
      kit.drawText(ctx, name, { x0: SAFE.left, x1: SAFE.right, y: yName, align: 'center', color: P.ink, each: (w, j, b, c) => M.letter(c, t, sn.at(j), w, b, name, P.ink, rtl) });
      M.marker(ctx, under, span(t, sn.end, sn.end + 0.25), P.pen, T.pen.line);
      kit.drawText(ctx, handle, { x0: SAFE.left, x1: SAFE.right, y: yHandle, align: 'center', color: P.ink, each: (w, j, b, c) => M.letter(c, t, sh.at(j), w, b, handle, P.ink, false) });
      if (slogan) kit.drawText(ctx, slogan, { x0: SAFE.left, x1: SAFE.right, y: ySlogan, align: 'center', color: P.grey, each: (w, j, b, c) => M.letter(c, t, ss.at(j), w, b, slogan, P.grey, rtl) });
    },
  };
}
