// A line as a deco title: the lead-in sits small on the axis between two engraved hairlines; under it a lacquer plate opens from the
// axis (a glint, a hairline running out both ways, then the plate opening up and down) and the statement rises in ivory, word by word
// from the centre outward. The key word (*…*) is cast in the metal, with its own sheen, a double rule under it and a star of light.
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut is accepted and shuts the plate the usual way)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const padX = 64, padY = 54, cx = W / 2;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: SAFE.right - SAFE.left - padX * 2, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 200, single: true, where: 'the lead-in' }) : null;
  const pw = Math.min(SAFE.right - SAFE.left + 40, Math.max(560, line.width + padX * 2)), ph = line.height + padY * 2;
  const leadH = lead ? lead.lead + 44 : 0;
  const top = spec.y ?? kit.place(leadH + ph, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), cy = top + leadH + ph / 2, yText = cy - line.height / 2 + line.lead / 2;
  const o = { x0: cx - line.width / 2, x1: cx + line.width / 2, y: yText, align: 'center' };
  const { rank, boxes } = M.centreOut(kit, line, o);
  const flat = line.rows.flatMap((r) => r.words), keyBox = boxes.find((b, i) => flat[i].key);
  const tOpen = at, tWords = at + T.dur.open * 0.8, tStar = at + T.dur.open * 0.8 + T.dur.stagger * boxes.length + T.dur.in;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, out0, d), sh = M.sheenAt(time, 3.2);
      if (lead) {
        M.flank(ctx, cx, yLead, lead.width / 2 + 26, 110, pal, span(t, at, at + 0.5) * (1 - M.E(out)), sh);
        kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'center', color: pal.muted,
          each: (w, i, box, c) => M.rise(c, span(t, at + 0.05 + i * T.dur.stagger, at + 0.05 + i * T.dur.stagger + T.dur.in), out, lead.size) });
      }
      const op = M.opening(span(t, tOpen, tOpen + T.dur.open), out);
      M.plate(ctx, cx, cy, pw, ph, pal, { ...op, sheen: sh });
      if (op.hf <= 0.05) return;
      ctx.save(); M.notched(ctx, cx, cy, pw * op.wf - 8, ph * op.hf - 8, 12); ctx.clip();
      kit.drawText(ctx, line, { ...o, color: pal.ivory, key: pal.gold,
        each: (w, i, box, c) => {
          const t0 = tWords + rank[i] * T.dur.stagger;
          if (M.rise(c, span(t, t0, t0 + T.dur.in), out, line.size) === false) return false;
          if (w.key) {
            c.fillStyle = M.metal(c, box.x, box.y - line.size * 0.5, box.x + box.width, box.y + line.size * 0.5, pal, M.sheenAt(time, 2.6), true);
            const rw = box.width * M.E(span(t, t0 + 0.15, t0 + 0.5)), y = box.y + line.size * 0.74;
            c.fillStyle = pal.gold; c.fillRect(box.x + (box.width - rw) / 2, y, rw, 3); c.fillRect(box.x + (box.width - rw) / 2, y + 7, rw, 1.5);
            c.fillStyle = M.metal(c, box.x, box.y - line.size * 0.5, box.x + box.width, box.y + line.size * 0.5, pal, M.sheenAt(time, 2.6), true);
          }
        } });
      ctx.restore();
      if (keyBox) {
        const tw = 0.35 + 0.25 * Math.sin((t - tStar) * 2.4);                        // the star flares once, then breathes
        const a = t < tStar ? 0 : Math.max(M.flare(t, tStar), t > tStar + 0.4 ? tw : 0) * (1 - out);
        M.sparkle(ctx, keyBox.x + keyBox.width - 4, keyBox.y - line.size * 0.78, line.size * 0.3, a, pal);
      }
    },
  };
}
