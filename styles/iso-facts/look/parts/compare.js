// Before and after on the board: a grey block stands on one side of the square with its panel pinned above it (the label and the old
// value). A stroke crosses the old value out and the grey block sinks back into the board; a dashed route runs across the square, a
// little car takes it, and an accent tower grows where it arrives, with a second panel popping open over it: the new value, on the
// accent marker. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const pad = T.panel.pad, x0 = SAFE.left, x1 = SAFE.right, ix0 = x0 + pad, ix1 = x1 - pad, maxW = ix1 - ix0;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 40, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW, minPx: 46, where: 'the compare label' }) : null;
  const hA = T.panel.top + (label ? label.height : 0) + was.height + pad * 0.4, hB = T.panel.top + now.height + pad * 0.4, gap = 40;
  const yA = kit.place(hA + gap + hB, 600), yB = yA + hA + gap;
  const yLabel = yA + T.panel.top + (label ? label.lead / 2 : 0), yWas = yA + T.panel.top + (label ? label.height : 0) + was.lead / 2, yNow = yB + T.panel.top + now.lead / 2;
  const OLD = [3.7, 7.6, 2.0, 2.0, 2.4], NEW = [7.7, 3.7, 1.9, 1.9, 3.3];
  const cutT = at + 0.95, nowT = at + 1.35;
  const route = [[OLD[0] + 1, OLD[1] - 0.6], [OLD[0] + 1, 5.4], [NEW[0] + 1, 5.4], [NEW[0] + 1, NEW[1] + NEW[3] + 0.5]];
  const plaza = (t) => (ctx, P) => {
    const rp = span(t, at + 1.05, at + 1.45);
    if (rp > 0) {                                                  // the dashed route, drawn along its length
      ctx.save(); ctx.strokeStyle = pal.line; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.lineCap = 'round';
      const L = route.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - route[i][0], p[1] - route[i][1]), 0); let left = L * rp;
      ctx.beginPath(); ctx.moveTo(...P(...route[0], 0.05));
      for (let i = 1; i < route.length && left > 0; i++) { const a = route[i - 1], b = route[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), f = Math.min(1, left / l); ctx.lineTo(...P(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0.05)); left -= l; }
      ctx.stroke(); ctx.restore();
    }
    const sink = 1 - 0.9 * M.E(span(t, cutT + 0.05, cutT + 0.45)), g = M.E(span(t, nowT, nowT + 0.45));
    const parts = [{ o: OLD, draw: () => M.block(ctx, P, OLD[0], OLD[1], 0, OLD[2], OLD[3], OLD[4], pal.grey, { grow: sink * M.E(span(t, at, at + 0.35)), windows: pal.grey.right }) },
      { o: NEW, draw: () => M.block(ctx, P, NEW[0], NEW[1], 0, NEW[2], NEW[3], NEW[4], pal.hot, { grow: g, windows: pal.blocks[3].right }) }];
    const cp = span(t, at + 1.4, at + 2.3);
    if (cp > 0 && cp < 1) {                                        // a little car drives the route
      const L = [], tot = route.slice(1).reduce((s, p, i) => { const l = Math.hypot(p[0] - route[i][0], p[1] - route[i][1]); L.push(l); return s + l; }, 0);
      let s = tot * M.E(cp), i = 0; while (i < L.length - 1 && s > L[i]) { s -= L[i]; i++; }
      const a = route[i], b = route[i + 1], f = Math.min(1, s / L[i]);
      const o = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0], dir = a[0] === b[0] ? 'y' : 'x';
      parts.push({ o, draw: () => M.vehicle(ctx, P, o[0], o[1], dir, 'car', pal.blocks[4], pal) });
    }
    parts.sort((a, b) => a.o[0] + a.o[1] + (a.o[2] ?? 0) - b.o[0] - b.o[1] - (b.o[2] ?? 0)).forEach((p) => p.draw());
  };
  const word = (t, t0) => (w, i, box, c) => { const s = t0 + i * 0.06; if (M.settle(c, span(t, s, s + T.dur.in), box) === false) return false; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, { plaza: plaza(t) });
      const out = M.OUT(span(t, d - T.dur.out, d));
      const pinA = ground.at(OLD[0] + OLD[2] / 2, OLD[1] + OLD[3] / 2, OLD[4] * (1 - 0.9 * M.E(span(t, cutT + 0.05, cutT + 0.45))), t), topA = [pinA[0], yA + hA];
      const pinB = ground.at(NEW[0] + NEW[2] / 2, NEW[1] + NEW[3] / 2, NEW[4] * M.E(span(t, nowT, nowT + 0.45)), t), topB = [pinB[0], yB + hB];
      M.leader(ctx, pinA, topA, span(t, at, at + 0.25) * (1 - out), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, at + 0.16, at + 0.46)) * (1 - out), topA[0], topA[1]) !== false) {
        M.panel(ctx, x0, yA, x1, yA + hA, pal, rtl, { tabColor: pal.grey.right });
        if (label) kit.drawText(ctx, label, { x0: ix0, x1: ix1, y: yLabel, align: 'start', color: pal.muted, each: word(t, at + 0.3) });
        kit.drawText(ctx, was, { x0: ix0, x1: ix1, y: yWas, align: 'start', color: pal.muted, key: pal.muted, each: word(t, at + 0.45) });
        const sp = M.E(span(t, cutT, cutT + 0.25));                  // the old value is crossed out from the reading side
        if (sp > 0) { const w = was.width + 24, sx = rtl ? ix1 + 12 : ix0 - 12; ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? sx - w * sp : sx, yWas - 4, w * sp, 8); }
      }
      ctx.restore();
      M.leader(ctx, pinB, topB, span(t, nowT - 0.05, nowT + 0.2) * (1 - out), pal);
      ctx.save();
      if (M.pop(ctx, M.Q(span(t, nowT + 0.07, nowT + 0.37)) * (1 - out), topB[0], topB[1]) !== false) {
        M.panel(ctx, x0, yB, x1, yB + hB, pal, rtl);
        const m = now.size * 0.11, nx0 = ix0 + m, nx1 = ix1 - m;
        now.rows.forEach((r, k) => M.marker(ctx, { x0: rtl ? nx1 - r.width : nx0, x1: rtl ? nx1 : nx0 + r.width, y: yNow + k * now.lead }, now.size, span(t, nowT + 0.1, nowT + 0.32), pal, rtl));
        kit.drawText(ctx, now, { x0: nx0, x1: nx1, y: yNow, align: 'start', color: pal.onAccent, key: pal.onAccent, each: word(t, nowT + 0.22) });
      }
      ctx.restore();
    },
  };
}
