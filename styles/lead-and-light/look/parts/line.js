// A line as a glazed panel set into the window. A border of small coloured pieces is set round the panel one piece at a time on the
// stepped clock, then the clear pane drops into its lead, dark and milky; the lead-in sits on its own narrow pane above. Then the sun
// moves behind it from the reading side and the painted words come up as the light reaches them. The key word (*…*) is painted on its
// own piece of the accent's glass, leaded into the pane, which glows when lit. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, cx = W / 2, b = 34;
  const padX = 60, padY = 52;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: SAFE.right - SAFE.left - 2 * b - padX * 2 + 20, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 140, single: true, where: 'the lead-in' }) : null;
  const pw = Math.min(SAFE.right - SAFE.left - 2 * b + 30, Math.max(520, line.width + padX * 2)), ph = line.height + padY * 2;
  const lw = lead ? lead.width + 80 : 0, lh = lead ? lead.lead + 30 : 0, leadH = lead ? lh + 30 + b : 0;
  const top = spec.y ?? kit.place(leadH + ph + 2 * b, 680);
  const ly = top, px = cx - pw / 2, py = top + leadH + b;
  const o = { x0: cx - line.width / 2, x1: cx + line.width / 2, y: py + padY + line.lead / 2, align: 'center' };
  const boxes = M.boxesOf(kit, line, o);
  const lo = lead ? { x0: cx - lead.width / 2, x1: cx + lead.width / 2, y: ly + lh / 2, align: 'center' } : null;
  const frame = M.border(px, py, pw, ph, pal, 31, b, 6);
  const tSun = at < 0 ? at + T.dur.set : at + T.dur.set + 0.15;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tq = M.q(t), out = span(t, d - T.dur.out, d), keep = 1 - Math.floor(out * 4) / 4;
      if (keep <= 0) return;
      const lit = M.sun(tq, tSun, T.dur.sun, rtl, 0.08);
      ctx.save(); ctx.globalAlpha = keep;
      if (lead && tq >= at) {
        const dy = tq < at + 0.17 ? -10 : 0;
        M.pane(ctx, cx - lw / 2, ly + dy, lw, lh, pal, { lit: lit(rtl ? cx + lw / 4 : cx - lw / 4, ly), lead: 7 });
        kit.drawText(ctx, lead, { ...lo, y: lo.y + dy, color: pal.paint, each: (w, i, box, c) => M.painted(c, lit(box.x + box.width / 2, box.y) * 1.25) });
      }
      frame.draw(ctx, span(tq, at, at + T.dur.set), lit);
      if (tq >= at + T.dur.set - 0.1) {
        const dy = tq < at + T.dur.set + 0.07 ? -12 : 0;
        ctx.save(); ctx.translate(0, dy);
        M.pane(ctx, px, py, pw, ph, pal, { lit: lit(rtl ? px + pw * 0.75 : px + pw * 0.25, py + ph / 2), r: 6, lead: 8 });
        boxes.forEach((bx) => {
          if (!bx.key) return;
          const L = lit(bx.x + bx.width / 2, bx.y);
          M.pane(ctx, bx.x - 8, bx.y - line.size * 0.66, bx.width + 16, line.size * 1.32, pal, { color: pal.accent, lit: 0.35 + 0.65 * L, r: 10, lead: 5 });
        });
        kit.drawText(ctx, line, { ...o, color: pal.paint, key: pal.keyText,
          each: (w, i, box, c) => M.painted(c, clamp(lit(box.x + box.width / 2, box.y) * 1.25)) });
        ctx.restore();
      }
      ctx.restore();
    },
  };
}
