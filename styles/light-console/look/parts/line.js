// A line on a hologram plate. The plate opens from its middle line; the lead-in and the statement resolve word by word under a scan bar;
// target brackets fly in and lock onto the key word (*…*), which only then takes the hologram's hue. Below, a wireframe crystal grows
// up from the projector under a scan plane and turns slowly, tied to the plate by a thin leader. Out: the plate collapses and the
// crystal switches off. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, sub = T.subject;
  const padX = 40, padY = 44, x0 = SAFE.left + padX, x1 = SAFE.right - padX, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.8, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, inner = (lead ? lead.height + gap : 0) + line.height, ph = inner + padY * 2;
  const top = spec.y ?? kit.place(ph, 600), yLead = top + padY + (lead ? lead.lead / 2 : 0), yLine = top + padY + (lead ? lead.height + gap : 0) + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const bLine = M.boxes(kit, line, { x0, x1, y: yLine, align: 'start' });
  const ki = bLine.findIndex((b) => b.key), keys = bLine.filter((b) => b.key);
  const scanAt = (k) => at + T.dur.open * 0.7 + k * T.dur.step;
  const lockT = ki >= 0 ? Math.max(at + 0.95, scanAt(nLead + bLine.lastIndexOf(keys.at(-1))) + T.dur.scan + 0.08) : 1e9;
  const kb = keys.length ? { x0: Math.min(...keys.map((b) => b.x)), x1: Math.max(...keys.map((b) => b.x + b.width)), y0: keys[0].y - line.size * 0.55, y1: keys.at(-1).y + line.size * 0.55 } : null;
  const mesh = M.meshes.join(M.meshes.octa(), M.meshes.box(0.42, 0.42, 0.42));
  const out0 = d - T.dur.out;
  const word = (t, base, size, out) => (w, i, box, c) => {
    if (out >= 1) return false;
    const r = M.resolve(c, span(t, scanAt(base + i), scanAt(base + i) + T.dur.scan), box, size, pal, rtl);
    if (r === false) return false;
    if (typeof r === 'string') return r;
    if (w.key) return t >= lockT ? pal.lock : pal.white;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d);
      // the subject and its leader
      const g = span(t, at, at + T.dur.grow), alive = 1 - M.I(out);
      M.wire(ctx, mesh, { cx: sub.x, cy: sub.y, s: sub.s, a: (t + clock) * 0.5, pal, alpha: alive, scanY: M.scanFrom(g, sub.y, sub.s), hot: t >= lockT ? Math.max(0, 1 - (t - lockT) / 0.4) : 0 });
      const lk = M.E(span(t, at + 0.4, at + 0.8)) * alive;
      if (lk > 0) { const y0 = top + ph, y1 = y0 + (sub.y - sub.s * 1.3 - y0) * lk; ctx.fillStyle = rgba(pal.hue, 0.5); ctx.fillRect(sub.x - 1, y0, 2, y1 - y0); ctx.fillStyle = pal.hue; ctx.fillRect(sub.x - 4, y1 - 4, 8, 8); }
      const k = M.plate(ctx, SAFE.left, top, SAFE.right - SAFE.left, ph, pal, span(t, at, at + T.dur.open), out);
      if (k <= 0) return;
      ctx.save(); ctx.beginPath(); const hh = ph * k; ctx.rect(0, top + (ph - hh) / 2, W, hh); ctx.clip();
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.soft, each: word(t, 0, lead.size, out) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.white, key: pal.white, each: word(t, nLead, line.size, out) });
      ctx.restore();
      if (kb) M.brackets(ctx, kb, span(t, lockT - T.dur.lock, lockT), pal, out);
    },
  };
}
