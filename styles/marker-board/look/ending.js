// The white board's ending: the marker fills in the brand's logo (uncovered from the top as it is coloured in), throws a loose box round
// it with the accent marker, writes the name under it and underlines it, then writes the handle (left to right) and the slogan in a
// lighter hand, and flies off the board. spec: { duration }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 700, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the slogan' }) : null;
  const S = 230, cx = W / 2, cy = 520, yName = cy + S / 2 + 150, yU = yName + name.size * 0.66;
  const yHandle = yU + 64 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const frame = M.box(1001, cx - S / 2 - 46, cy - S / 2 - 46, cx + S / 2 + 46, cy + S / 2 + 46);
  const under = rtl ? M.stroke(1002, cx + name.width / 2 + 20, yU, cx - name.width / 2 - 20, yU + 4, 3) : M.stroke(1002, cx - name.width / 2 - 20, yU, cx + name.width / 2 + 20, yU + 4, 3);
  const sName = M.schedule(name, 1.05, 1.6, 0.06), sHandle = M.schedule(handle, 1.95, 2.3, 0.04), sSlogan = slogan ? M.schedule(slogan, 2.35, 2.8, 0.05) : [];
  const bName = M.layout(name, { x0, x1, y: yName, align: 'center' }, rtl), bHandle = M.layout(handle, { x0, x1, y: yHandle, align: 'center' }, rtl);
  const bSlogan = slogan ? M.layout(slogan, { x0, x1, y: ySlogan, align: 'center' }, rtl) : [];
  const fill = { s: 0.15, e: 0.6, color: P.ink, at: (p) => { const row = Math.floor(p * 6), u = p * 6 - row; return [cx - S / 2 + S * (row % 2 ? 1 - u : u), cy - S / 2 + S * (row + 0.5) / 6]; } };
  const jobs = [fill, M.pathJob(frame, 0.65, 1.0, P.accent),
    ...bName.map((b, i) => M.wordJob(b, sName[i].s, sName[i].e, P.ink)), M.pathJob(under, 1.62, 1.85, P.accent),
    ...bHandle.map((b, i) => M.wordJob(b, sHandle[i].s, sHandle[i].e, P.soft)), ...bSlogan.map((b, i) => M.wordJob(b, sSlogan[i].s, sSlogan[i].e, P.soft))];
  const writer = (t, sched, size) => (w, i, box, c) => { if (M.write(c, span(t, sched[i].s, sched[i].e), box, size, w.arabic) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ink = M.ink(ctx, P.ink, P.board), soft = M.ink(ctx, P.soft, P.board, 6), acc = M.ink(ctx, P.accent, P.board, 7);
      const pl = span(t, fill.s, fill.e);
      if (pl > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx - S, cy - S / 2 - 4, S * 2, (S + 8) * pl); ctx.clip(); brand.logo.draw(ctx, cx - S / 2, cy - S / 2, S, ink); ctx.restore(); }
      M.trace(ctx, frame, span(t, 0.65, 1.0), T.pen.line, acc);
      kit.drawText(ctx, name, { x0, x1, y: yName, color: ink, key: ink, each: writer(t, sName, name.size) });
      M.trace(ctx, under, span(t, 1.62, 1.85), T.pen.line, acc);
      kit.drawText(ctx, handle, { x0, x1, y: yHandle, color: soft, key: soft, each: writer(t, sHandle, handle.size) });
      if (slogan) kit.drawText(ctx, slogan, { x0, x1, y: ySlogan, color: soft, key: soft, each: writer(t, sSlogan, slogan.size) });
      M.drawPen(ctx, M.penAt(jobs, t, W, rtl), P, rtl);
    },
  };
}
