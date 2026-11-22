// Before and after, as a change of territory: the old value is a grey scrap pinned on the map; it is torn off (it swings round its
// pin, rips free and is thrown out of the panel, leaving a torn corner under the pin) and the new value is slapped down in its place
// on a scrap of the accent, while the card puppet below swings its arm down with the slap. The label is a narration caption.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, clamp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, G = ground.stage;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 160;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: T.size.compare * 0.85, weight: 800, maxW, minScale: 0.6, where: 'the old value' });
  const now = kit.fit(asText(S.now).replace(/\*/g, ''), { size: T.size.compare, weight: 900, maxW, minScale: 0.6, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead ?? 42, weight: 700, maxW: SAFE.right - SAFE.left - 80, single: true, where: 'the compare label' }) : null;
  const cw = label ? label.width + 60 : 0, ch = label ? label.lead + 28 : 0, cap = label ? M.torn(cw, ch, 5, 3) : null;
  const capX = rtl ? SAFE.right - cw / 2 : SAFE.left + cw / 2, capY = SAFE.top + 22 + ch / 2;
  const cx = W / 2, cy = 640;
  const ww = was.width + 120, wh = was.height + 50, nw = now.width + 130, nh = now.height + 60;
  const oldP = M.torn(ww, wh, 12, 7), newP = M.torn(nw, nh, 13, 8), corner = new Path2D();
  corner.moveTo(-32, -wh / 2 - 4); corner.lineTo(34, -wh / 2 - 2); corner.lineTo(8, -wh / 2 + 44); corner.lineTo(-20, -wh / 2 + 30); corner.closePath();
  const tWas = at + 0.1, tTear = at + 0.8, tNow = at + 1.35;
  const px = rtl ? SAFE.left + 120 : SAFE.right - 120, py = G.y + G.h - 10, face = rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const h = M.held(t + clock);
      const arm = t < tTear - 0.15 ? 0.2 : t < tNow - 0.05 ? 2.6 : t < tNow + 0.35 ? 0.9 : [0.3, 0.45][h % 2];
      M.puppet(ctx, px, py, 0.7, { arm: [arm, 0.15], head: t > tNow ? -0.06 : 0.02, mouth: t > tWas && t < tNow + 0.6 && h % 2 === 0 }, P, { face });
      if (cap) M.slapped(ctx, span(t, at, at + T.dur.slap), capX, capY, (s) => {
        M.paper(ctx, cap, P.caption, P, { shadow: s, edge: P.ink });
        kit.drawText(ctx, label, { x0: -cw / 2 + 30, x1: cw / 2 - 30, y: 0, align: 'start', color: P.ink });
      });
      const tear = span(t, tTear, tTear + 0.5);
      if (tear > 0 && t < tNow + 0.1) { ctx.save(); ctx.translate(cx, cy); M.paper(ctx, corner, P.old, P, { shadow: 0.5 }); ctx.restore(); }
      if (tear < 1) {
        const pinY = cy - wh / 2 + 20;
        const swing = clamp(tear / 0.4), fly = clamp((tear - 0.4) / 0.6), side = rtl ? -1 : 1;
        M.slapped(ctx, span(t, tWas, tWas + T.dur.slap), cx, pinY, (s) => {
          ctx.translate(side * 700 * fly * fly, 900 * fly * fly); ctx.rotate(side * (0.35 * swing + 1.6 * fly));
          ctx.translate(0, wh / 2 - 20);
          M.paper(ctx, oldP, P.old, P, { shadow: s + fly * 2 });
          kit.drawText(ctx, was, { x0: -ww / 2 + 60, x1: ww / 2 - 60, y: -was.height / 2 + was.lead / 2 + 6, align: 'center', color: P.ink });
        });
      }
      if (t < tTear || t < tNow + 0.1) M.pin(ctx, cx, cy - wh / 2 + 20, P, 11);
      M.slapped(ctx, span(t, tNow, tNow + T.dur.slap), cx, cy, (s) => {
        ctx.rotate(0.02); M.paper(ctx, newP, P.accent, P, { shadow: s });
        kit.drawText(ctx, now, { x0: -nw / 2 + 60, x1: nw / 2 - 60, y: -now.height / 2 + now.lead / 2 + 6, align: 'center', color: P.onAccent });
        M.pin(ctx, 0, -nh / 2 + 22, P, 11);
      });
    },
  };
}
