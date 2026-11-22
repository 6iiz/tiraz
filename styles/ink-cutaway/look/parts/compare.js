// Before and after: the path is blocked. A hatched plug sits in the tube and the accent path stops at it with a cross. The old value
// is struck with a dashed line (a hidden line, in drafting) and greys back; the plug turns to a dashed outline and fades; then the path
// runs through to the outlet and down the margin to the new value, which is inked in the key colour and underlined by the path.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left, x0 = SAFE.left, x1 = SAFE.right;
  const g = { cx: W / 2 - 40, cy: 520, L: T.spec.L, R: T.spec.R };
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.72, weight: 600, maxW, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare, weight: 800, maxW, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, minScale: 0.96, minPx: 44, where: 'the compare label' }) : null;
  let y = g.cy + g.R + 110;
  const yLabel = label ? y + label.lead / 2 : 0; if (label) y += label.height + 10;
  const yWas = y + was.lead / 2; y += was.height + 6;
  const yNow = y + now.lead / 2;
  const nb = M.boxes(kit, now, x0, x1, yNow), lastRow = now.rows.length - 1, nr = nb.filter((b) => b.row === lastRow);
  const nowRun = { x0: Math.min(...nr.map((b) => b.x)), x1: Math.max(...nr.map((b) => b.x + b.width)), y: nr[0].y, row: lastRow };
  const wb = M.boxes(kit, was, x0, x1, yWas);
  const cutT = at + 0.85, nowT = at + 1.35, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      const plug = t < cutT ? 1 : 0.99 * (1 - span(t, cutT + 0.1, cutT + 0.5));
      const flowP = t < cutT ? span(t, at + 0.1, at + 0.6) : 0.58 + 0.42 * span(t, nowT - 0.3, nowT + 0.15);
      ctx.save(); ctx.globalAlpha = 1 - q;
      const pts = M.specimen(ctx, pal, g, { draw: span(t, at - 0.3, at + 0.3), cut: M.E(span(t, at - 0.1, at + 0.5)), flow: t, flowP, plug, rtl });
      M.pathToKey(ctx, pal, pts.outlet, nowRun, now.size, span(t, nowT + 0.1, nowT + 0.6), rtl, SAFE.right + 14);
      // the dashed strike through the old value
      const ps = span(t, cutT - 0.1, cutT + 0.15);
      if (ps > 0) was.rows.forEach((r, ri) => {
        const b = wb.filter((z) => z.row === ri), a0 = Math.min(...b.map((z) => z.x)) - 12, a1 = Math.max(...b.map((z) => z.x + z.width)) + 12, yy = yWas + ri * was.lead + was.size * 0.05;
        M.stroke(ctx, rtl ? [[a1, yy], [a0, yy]] : [[a0, yy], [a1, yy]], ps, { color: pal.ink, width: 3, dash: [16, 9] });
      });
      ctx.restore();
      const ghost = lerp(1, 0.45, M.soft(span(t, cutT + 0.1, cutT + 0.5)));
      if (label) kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.inked(c, t, at + i * 0.05, T.dur.word, out0, d, box, label.size, rtl) === false) return false; } });
      kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: pal.grey, key: pal.grey,
        each: (w, i, box, c) => { if (M.inked(c, t, at + 0.2 + i * 0.05, T.dur.word, out0, d, box, was.size, rtl) === false) return false; c.globalAlpha *= ghost; } });
      kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.key, key: pal.key,
        each: (w, i, box, c) => { if (M.inked(c, t, nowT + i * 0.06, 0.25, out0, d, box, now.size, rtl) === false) return false; } });
    },
  };
}
