// A line as a comic panel: the lead is a narration caption slapped into the panel's top corner, the statement is said by a card
// puppet standing at the foot of the panel, in a speech balloon that is slapped down over the map. Each key word (*…*) is a torn
// scrap of the accent slapped onto the balloon under the word. The puppet talks in held poses (mouth and arm change a few times a
// second). spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, S = ground.stage;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW: 760, minScale: 0.62 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 700, maxW: SAFE.right - SAFE.left - 80, minScale: 0.6, where: 'the lead-in' }) : null;
  const cap = lead ? { w: lead.width + 60, h: lead.height + 28 } : null;
  const capX = cap ? (rtl ? SAFE.right - cap.w : SAFE.left) : 0, capY = SAFE.top + 22;
  const bw = line.width + 120, bh = line.height + 70, bx = (W - bw) / 2;
  const by = Math.max(cap ? capY + cap.h + 50 : SAFE.top + 40, Math.min(spec.y ?? 520, 900 - bh));
  const px = rtl ? SAFE.left + 150 : SAFE.right - 150, py = S.y + S.h - 10, ps = 0.8, face = rtl ? 1 : -1;
  const tail = [px + face * 30, py - 445 * ps];
  const bPath = M.balloon(bx, by, bw, bh, tail[0], tail[1]);
  const capPath = cap ? M.torn(cap.w, cap.h, 3, 3) : null;
  const keys = []; kit.drawText(document.createElement('canvas').getContext('2d'), line, { x0: bx + 60, x1: bx + bw - 60, y: by + 35 + line.lead / 2, align: 'center',
    each: (w, i, box) => { if (w.key) keys.push({ ...box, path: M.torn(box.width + line.size * 0.2, line.size * 1.2, 20 + i, 5) }); return false; } });
  const tB = at + 0.1, tK = at + 0.45;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const h = M.held(t + clock), talking = t > tB && t < tB + 1.6;
      M.puppet(ctx, px, py, ps, { arm: [talking ? [0.9, 1.5, 1.1][h % 3] : 0.2, 0.1], head: talking ? [0.04, -0.03][h % 2] : 0, mouth: talking && h % 2 === 0 }, P, { face });
      if (cap) M.slapped(ctx, span(t, at, at + 0.22), capX + cap.w / 2, capY + cap.h / 2, (sh) => {
        M.paper(ctx, capPath, P.caption, P, { shadow: sh, edge: P.ink });
        ctx.translate(-(capX + cap.w / 2), -(capY + cap.h / 2));
        kit.drawText(ctx, lead, { x0: capX + 30, x1: capX + cap.w - 30, y: capY + 14 + lead.lead / 2, align: 'start', color: P.ink });
      });
      const pb = span(t, tB, tB + 0.22);
      M.slapped(ctx, pb, W / 2, by + bh / 2, (sh) => {
        ctx.translate(-W / 2, -(by + bh / 2));
        ctx.save(); ctx.translate(7 * sh, 9 * sh); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill(bPath); ctx.restore();
        ctx.fillStyle = P.paper; ctx.fill(bPath); ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke(bPath);
        keys.forEach((k) => M.slapped(ctx, span(t, tK, tK + 0.22), k.x + k.width / 2, k.y, (s2) => { ctx.rotate(-0.025); M.paper(ctx, k.path, P.accent, P, { shadow: s2 * 0.6 }); }));
        if (pb > 0.5) kit.drawText(ctx, line, { x0: bx + 60, x1: bx + bw - 60, y: by + 35 + line.lead / 2, align: 'center', color: P.ink, key: P.ink,
          each: (w) => (w.key && t >= tK + 0.1 ? P.onAccent : undefined) });
      });
    },
  };
}
