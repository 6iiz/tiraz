// Before and after as a collage. The label is a dark label slip; the old value is put down on a paper slip, then cut through with
// a jagged scissor line and its two halves fall away, turning, off the table. The new value is put down in its place on a larger
// slip of the accent and pressed home. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: T.textW - 100, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW: T.textW - 60, single: true, where: 'the compare label' }) : null;
  const lw = label ? label.width + 60 : 0, lh = label ? label.lead + 24 : 0;
  const ww = Math.max(380, was.width + 110), wh = was.height + 46, nw = Math.max(460, now.width + 130), nh = now.height + 70;
  const block = (label ? lh + 34 : 0) + wh + 40 + nh, top = Math.min(kit.place(block, 640), T.floor - block);
  const cyL = top + lh / 2, cyW = top + (label ? lh + 34 : 0) + wh / 2, cyN = cyW + wh / 2 + 40 + nh / 2;
  const labS = label ? M.torn(lw, lh, 81, 8) : null, wasS = M.torn(ww, wh, 83, 10), nowS = M.torn(nw, nh, 87, 14, true);
  const zig = []; for (let y = -wh / 2 - 10, k = 0; y <= wh / 2 + 10; y += 12, k++) zig.push([(k % 2 ? 9 : -9), y]);
  const half = (side) => (c) => { c.moveTo(side * (ww / 2 + 40), -wh / 2 - 20); zig.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(side * (ww / 2 + 40), wh / 2 + 20); c.closePath(); };
  const tW = at + 0.12, tCut = at + 0.8, tFall = at + 0.98, tNow = at + 1.3;
  const wasBody = (c, decor) => { M.slip(c, P, wasS, P.paper); kit.drawText(c, was, { x0: -was.width / 2, x1: was.width / 2, y: -was.height / 2 + was.lead / 2, color: P.ink, key: P.ink, decor }); };
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      if (label) M.piece(ctx, P, M.press(span(tt, at, at + T.dur.press), -1.5, -1), W / 2 + (rtl ? 1 : -1) * 120, cyL, labS, (c) => {
        M.slip(c, P, labS, P.ink); kit.drawText(c, label, { x0: -label.width / 2, x1: label.width / 2, y: 0, color: P.paper, key: P.paper });
      });
      const f = span(tt, tFall, tFall + 0.75);
      if (f <= 0) {
        M.piece(ctx, P, M.press(span(tt, tW, tW + T.dur.press), 1.2, 1), W / 2, cyW, wasS, (c) => {
          wasBody(c, false);
          const cp = span(tt, tCut, tCut + 0.17);                       // the scissor line runs down the slip
          if (cp > 0) { c.strokeStyle = P.ink; c.lineWidth = 2.5; c.setLineDash([9, 6]); c.beginPath(); zig.slice(0, Math.ceil(zig.length * cp)).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.setLineDash([]); }
        });
      } else if (f < 1) {
        for (const side of [-1, 1]) {                                    // the halves fall apart, turning, on twos
          const dx = side * (60 * f + 40 * f * f), dy = 900 * f * f - 40 * f, rot = (side * (6 + 26 * f) + 1.2) * Math.PI / 180;
          ctx.save(); ctx.translate(W / 2 + dx, cyW + dy); ctx.rotate(rot);
          ctx.save(); ctx.translate(10, 14); ctx.filter = 'blur(8px)'; ctx.fillStyle = P.shadow; ctx.beginPath(); half(side)(ctx); ctx.clip(); ctx.beginPath(); wasS(ctx); ctx.fill(); ctx.restore();
          ctx.beginPath(); half(side)(ctx); ctx.clip(); wasBody(ctx, true);
          ctx.restore();
        }
      }
      M.piece(ctx, P, M.press(span(tt, tNow, tNow + T.dur.press * 1.2), -1.8, -1), W / 2, cyN, nowS, (c) => {
        M.slip(c, P, nowS, P.accent);
        kit.drawText(c, now, { x0: -now.width / 2, x1: now.width / 2, y: -now.height / 2 + now.lead / 2, color: P.onAccent, key: P.onAccent });
      });
    },
  };
}
