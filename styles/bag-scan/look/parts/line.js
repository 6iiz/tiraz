// A line on the belt: the statement is the content of a case seen through the beam. The belt pulls the case in past the line sensor
// from the reading side and stops; the operator then snaps a dashed selection box onto the key phrase (*…*, one or several words) and
// switches it to inverse. On the way out the belt pulls everything on. spec: { duration, at?, y?, cut?: true, says: { text, lead? } }
//   cut: the case stays until the joint (the next belt pull) takes it.
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: T.minPx, where: 'the lead-in' }) : null;
  const gap = lead ? 16 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + T.pad * 2, 720) + T.pad;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const box = { x: SAFE.left, y: top - T.pad, w: SAFE.right - SAFE.left, h: block + T.pad * 2 };
  const shell = M.bag(box.w, box.h, pal, 1);
  const runs = M.keyRuns(line, { x0, x1, y: yLine, align: 'start', rtl });
  const f = at < 0 ? Math.min(1, (-at - 0.05) / (T.dur.belt + 0.4)) : 1;    // a hook is complete on the first frame
  const tStop = at + T.dur.belt * f, tSel = tStop + 0.05 * f, out0 = spec.cut ? Infinity : d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx);
      const off = M.belt(t, at, T.dur.belt * f, out0, W, ground.dir);
      const running = Math.min(1, Math.abs(off) / 60);
      ctx.save(); ctx.beginPath();
      ctx.rect(rtl ? 0 : ground.sensorX, ground.top, rtl ? ground.sensorX : W - ground.sensorX, ground.bottomY - ground.top); ctx.clip();
      ground.items(ctx, off);
      ctx.translate(off, 0);
      ctx.drawImage(shell.cv, box.x - shell.pad, box.y - shell.pad);
      const ps = span(t, tSel, tSel + 0.3 * f);
      runs.forEach((r) => M.inverse(ctx, pal, r, ps, rtl));
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', decor: Math.abs(off) > 1, color: pal.soft });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', decor: Math.abs(off) > 1, color: pal.ink, key: pal.ink, each: (w, i, b, c) => (w.key && ps > 0.5 ? pal.light : undefined) });
      runs.forEach((r) => { const px = r.size * 0.12 + 4, h = r.size * 1.2 + 30; M.select(ctx, pal, r.x - px, r.y - h / 2, r.w + px * 2, h, ps, t); });
      ctx.restore();
      ground.sensor(ctx, running);
    },
  };
}
