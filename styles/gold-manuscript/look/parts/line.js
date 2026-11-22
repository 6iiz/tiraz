// A line as an inscription. The lead-in is written on a forked ribbon; under it a vellum panel with cut corners is painted in the
// painter's order (ink outline drawn round it, vellum laid, the dark band inside, pearls dotted along it). The key word (*…*) gets a
// bed of gold leaf, laid square by square, before the pen reaches it; then the statement is written word by word from the reading side,
// and a light crosses the leaf so its squares flash. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2;
  const padX = 70, padY = 64;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: SAFE.right - SAFE.left - padX * 2, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 160, single: true, where: 'the lead-in' }) : null;
  const pw = Math.min(SAFE.right - SAFE.left + 30, Math.max(600, line.width + padX * 2)), ph = line.height + padY * 2;
  const rw = lead ? lead.width + 70 : 0, rh = lead ? lead.lead + 24 : 0, leadH = lead ? rh + 40 : 0;
  const top = spec.y ?? kit.place(leadH + ph, 660);
  const yLead = top + rh / 2, px = cx - pw / 2, py = top + leadH;
  const o = { x0: cx - line.width / 2, x1: cx + line.width / 2, y: py + padY + line.lead / 2, align: 'center' };
  const boxes = M.boxesOf(kit, line, o);
  const tWrite = at + (at < 0 ? 0.35 : 0.45), gap = 0.04, speed = at < 0 ? T.pen * 1.25 : T.pen;                       // the pen moves at `speed` px a second
  let tw = tWrite; const when = boxes.map((b) => { const t0 = tw; tw += b.width / speed + gap; return [t0, tw - gap]; });
  const leaves = boxes.map((b, i) => (b.key ? { l: M.leaf(b.x - 8, b.y - line.size * 0.62, b.width + 16, line.size * 1.24, pal, 70 + i, 16), t: when[i][0] - 0.4 } : null));
  const inset = (c) => M.panelPath(c, px + 12, py + 12, pw - 24, ph - 24, 22);
  const pearls = M.pearlRow(px + 24, py + 24, pw - 48, ph - 48, 30);
  const leadO = lead ? { x0: cx - lead.width / 2, x1: cx + lead.width / 2, y: yLead, align: 'center' } : null;
  const lb = lead ? M.boxesOf(kit, lead, leadO) : [];
  let lt = at + 0.2; const lwhen = lb.map((b) => { const t0 = lt; lt += b.width / speed + gap; return t0; });
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, out0, d), light = ground.light(time + 1.3);
      ctx.save(); ctx.globalAlpha = 1 - out;
      if (lead) {
        M.painted(ctx, span(t, at - 0.1, at + 0.4), (c) => M.ribbonPath(c, cx, yLead, rw, rh), rw * 2 + rh * 3, pal, { weight: 3.5 });
        kit.drawText(ctx, lead, { ...leadO, color: pal.rubric, each: (w, i, box, c) => M.pen(c, span(t, lwhen[i], lwhen[i] + box.width / speed), box, lead.size, kit.rtl) });
      }
      M.painted(ctx, span(t, at, at + 0.7), (c) => M.panelPath(c, px, py, pw, ph, 34), (pw + ph) * 2, pal, { inset, pearls });
      leaves.forEach((L, i) => { if (L) L.l.draw(ctx, span(t, L.t, L.t + 0.4), M.sweep(L.l.x, L.l.x + L.l.w, span(t, when[i][1] + 0.1, when[i][1] + 0.9), kit.rtl, light)); });
      kit.drawText(ctx, line, { ...o, color: pal.ink, key: pal.ink,
        each: (w, i, box, c) => M.pen(c, span(t, when[i][0], when[i][1]), box, line.size, kit.rtl) });
      ctx.restore();
    },
  };
}
