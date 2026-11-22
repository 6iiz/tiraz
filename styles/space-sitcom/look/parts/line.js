// A line of dialogue. The lead comes first as a terminal tag (a dark screen strip; its words are typed in behind an accent cursor);
// then the tall one says the line: a speech bubble opens from its tail and the words drop in as he talks. When the line is complete the
// key word (*…*) gets an accent splat with a springy pop, and the blob does a reaction take (its eye goes huge, its mouth drops open).
// spec: { duration, at?, y?, cut?, says: { text, lead? } }   (cut changes nothing: the portal joint carries every scene out)
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl, C = T.cast;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const bx0 = SAFE.left, bx1 = SAFE.right, x0 = bx0 + 56, x1 = bx1 - 56;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: x1 - x0, minScale: 0.75, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0 - 40, minScale: 0.88, where: 'the lead-in' }) : null;
  const tagH = lead ? lead.height + 44 : 0, gap = lead ? 46 : 0, bubH = line.height + 110;
  const top = spec.y ?? kit.place(tagH + gap + bubH, 700);
  const tagY0 = top, tagY1 = top + tagH, by0 = tagY1 + gap, by1 = by0 + bubH;
  const yLead = tagY0 + 22 + (lead ? lead.lead / 2 : 0), yLine = by0 + 55 + line.lead / 2;
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nLine = line.rows.reduce((s, r) => s + r.words.length, 0);
  // the hook is whole by frame 0: an early part runs its whole entrance within 0.7 s
  const fast = at < 0, tTag = at, tType = at + 0.08, stepL = fast ? Math.min(0.06, 0.25 / Math.max(1, nLead)) : 0.09;
  const tBub = lead ? tType + nLead * stepL + (fast ? 0 : 0.1) : at, tW0 = tBub + 0.18;
  const stepW = fast ? Math.max(0.02, Math.min(0.06, (-0.35 - tW0) / Math.max(1, nLine))) : Math.min(0.16, 1.2 / Math.max(1, nLine));
  const tDone = tW0 + nLine * stepW, tSplat = tDone + (fast ? 0.02 : 0.15);
  const [mx, my] = M.mouthOf(C, 'tall');
  const keys = M.layout(line, { x0, x1, y: yLine }, rtl).map((b, i) => ({ ...b, i })).filter((b) => b.key);
  // neighbouring key words share one splat
  const splats = []; keys.forEach((b) => { const s = splats.at(-1); if (s && s.y === b.y && s.last === b.i - 1) { const a = Math.min(s.x, b.x), e = Math.max(s.x + s.width, b.x + b.width); s.x = a; s.width = e - a; s.last = b.i; } else splats.push({ ...b, last: b.i }); });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = ground.k(t), tt = t + clock, take = span(t, tSplat + 0.05, tSplat + 0.25) * (1 - span(t, tSplat + 1.6, tSplat + 2.2));
      M.duo(ctx, P, C, tt, k, { talk: M.talk(tt, t >= tW0 - 0.1 && t < tDone + 0.25 ? 1 : 0), look: [0.4, -0.6] }, { take, look: [-0.6, -0.8] });
      if (lead) {
        M.tag(ctx, P, k, bx0 + 20, tagY0, bx1 - 20, tagY1, span(t, tTag, tTag + 0.2));
        let last = null;
        kit.drawText(ctx, lead, { x0, x1, y: yLead, color: P.light, key: P.accent,
          each: (w, i, box) => { if (t < tType + i * stepL) return false; last = box; } });
        if (last && Math.floor(tt * 3) % 2 === 0) { ctx.fillStyle = P.accent; const cx = rtl ? last.x - 30 : last.x + last.width + 10; ctx.fillRect(cx, last.y - lead.size * 0.45, 20, lead.size * 0.9); }
      }
      if (M.bubble(ctx, P, k, bx0, by0, bx1, by1, mx, my, span(t, tBub, tBub + 0.2)) === false) return;
      splats.forEach((b) => M.splat(ctx, P, b, line.size, span(t, tSplat, tSplat + 0.3), k));
      kit.drawText(ctx, line, { x0, x1, y: yLine, color: P.dark, key: P.onAccent,
        each: (w, i, box, c) => { const p = span(t, tW0 + i * stepW, tW0 + i * stepW + 0.1); if (p <= 0) return false; c.translate(0, -(1 - M.ease.outCubic(p)) * 26); } });
    },
  };
}
