// Before and after as a diversion on the map. One line is drawn through a stop that carries the old value. Then the stop closes:
// it is crossed out, its name is struck and greyed, and the line past the junction goes out of service (pale and dashed). From the
// junction a new branch is drawn down at 45 degrees to a lower level and on to a new interchange, whose name, the new value, is
// printed on a plate in the accent. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl, w = T.line.w;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), I = ground.I;
  const X = (x) => (rtl ? x : W - x);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: SAFE.right - SAFE.left - 160, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  const lh = label ? label.lead + 40 : 0, rowA = was.height + 70, rowB = now.height + 70, drop = 170;
  const top = kit.place(lh + rowA + drop + rowB, 720), yLabel = top + (label ? label.lead / 2 : 0);
  const yWas = top + lh + was.height / 2, yRA = top + lh + rowA - 20, yRB = yRA + drop + now.height + 50, yNow = yRB - 50 - now.height / 2;
  const cx = W / 2, jx = X(SAFE.right - 70), s = rtl ? -1 : 1;
  const A = M.route([[X(W + 20), yRA], [X(-20), yRA]]);
  const B = M.route([[jx, yRA], [jx + s * 30, yRA + 30], [jx + s * 30, yRB - 60], [jx + s * 90, yRB], [X(-20), yRB]], T.line.r);
  const jLen = Math.abs(jx - A.pts[0][0]);
  const cutT = at + 0.95, nowT = at + 1.45;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const o = M.I(span(t, d - T.dur.out, d)); if (o >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, -30 * o);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'start', color: I.dim,
        each: (w2, i, box, c) => M.print(c, span(t, at - 0.2 + i * 0.05, at - 0.2 + i * 0.05 + T.dur.print), box, label.size, rtl) });
      const pa = M.D(span(t, at - 0.1, at + 0.5)), head = A.total * pa, closed = t >= cutT;
      const reachA = Math.abs(cx - A.pts[0][0]) <= head;
      if (!closed) M.line(ctx, A, I.lines[0], w, 0, head, true);
      else {
        M.line(ctx, A, I.lines[0], w, 0, jLen);
        ctx.save(); ctx.setLineDash([w * 1.2, w * 0.9]); M.line(ctx, A, I.ghost(I.lines[0]), w * 0.8, jLen, A.total); ctx.restore();
      }
      // the branch
      const pb = M.D(span(t, cutT + 0.1, nowT));
      if (pb > 0) M.line(ctx, B, I.lines[0], w, 0, B.total * pb, true);
      // stop A, then its closing
      if (reachA) M.station(ctx, cx, yRA, w * 0.75, I, span(t, at + 0.25, at + 0.5));
      const px = M.E(span(t, cutT, cutT + 0.2));
      if (px > 0) { ctx.strokeStyle = I.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; const r = w * 1.1 * px; ctx.beginPath(); ctx.moveTo(cx - r, yRA - r); ctx.lineTo(cx + r, yRA + r); ctx.moveTo(cx + r, yRA - r); ctx.lineTo(cx - r, yRA + r); ctx.stroke(); }
      const grey = closed ? I.dim : I.ink;
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas - was.height / 2 + was.lead / 2, color: grey, key: grey,
        each: (w2, i, box, c) => M.print(c, span(t, at + 0.3 + i * 0.05, at + 0.3 + i * 0.05 + T.dur.print), box, was.size, rtl) });
      const ps = span(t, cutT + 0.05, cutT + 0.3);
      if (ps > 0) { const L = (was.width + 30) * ps; ctx.fillStyle = I.ink; ctx.fillRect(rtl ? cx + was.width / 2 + 15 - L : cx - was.width / 2 - 15, yWas - 3, L, 6); }
      // stop B, the interchange, and its plate
      const reachB = pb > 0 && Math.abs(cx - jx) + (yRB - yRA) <= B.total * pb;
      const pl = span(t, nowT, nowT + 0.3);
      if (reachB || pb >= 1) M.capsule(ctx, cx, yRB, 40, w, I, clamp(pl * 1.2));
      if (pl > 0) M.plate(ctx, { x: cx - now.width / 2, y: yNow, width: now.width }, now.size, I.accent, pl);
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow - now.height / 2 + now.lead / 2, color: pl > 0 ? I.onAccent : I.ink, key: pl > 0 ? I.onAccent : I.ink,
        each: (w2, i, box, c) => M.print(c, span(t, nowT - 0.05, nowT - 0.05 + T.dur.print), box, now.size, rtl) });
      ctx.restore();
    },
  };
}
