// A number, as a stat panel in the window: the cursor presses the panel's run button, the number counts up and a progress bar fills
// under it, and the pixel buddy runs on top of the bar at its leading edge, as if pushing it. When the count lands, the buddy jumps and
// cheers. The label sits under the bar. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, rr } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, B = M.buddy(P, T.px), c = M.content();
  const x0 = c.x0 + 20, x1 = c.x1 - 20, maxW = x1 - x0;
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minPx: 44, where: 'the count label' });
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > maxW && size > 110) size -= 8;
  const btn = { w: 150, h: 64 }, bx = rtl ? x1 - btn.w : x0, by = c.y0 + 10;
  const yNum = by + btn.h + 40 + size * 0.5, barY = yNum + size * 0.4 + 100, barH = 26, yLabel = barY + barH + 40 + label.lead / 2;
  const t0 = at + 0.3, t1 = at + 1.5;
  const front = (p) => (rtl ? x1 - maxW * p : x0 + maxW * p);
  const path = [{ t: at - 0.4, x: W - 90, y: 1250 }, { t: at + 0.05, x: bx + btn.w / 2 + 10, y: by + btn.h / 2 + 10 }, { t: 1.6, x: bx + btn.w / 2 + 10, y: by + btn.h / 2 + 10 }, { t: 2.5, x: bx + btn.w / 2 + 160, y: by + btn.h + 120 }];
  const clicks = [at + 0.12];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.zoom(ctx, W, H, 1 + (T.zoom - 1) * M.IO(span(t, at + 0.3, at + 1.3)), W / 2, (yNum + barY) / 2);
      M.windowFrame(ctx, P, brand, rtl, t + clock, 1);
      const pressed = span(t, at + 0.12, at + 0.2);
      ctx.fillStyle = pressed > 0 ? P.accent : P.chrome; rr(ctx, bx, by, btn.w, btn.h, btn.h / 2); ctx.fill();
      ctx.fillStyle = pressed > 0 ? P.onAccent : P.ink; ctx.beginPath();
      const tx = bx + btn.w / 2 - 8; ctx.moveTo(tx - 6, by + 18); ctx.lineTo(tx + 20, by + btn.h / 2); ctx.lineTo(tx - 6, by + btn.h - 18); ctx.fill();
      const p = span(t, t0, t1);
      kit.number(ctx, text(countValue(0, S.value, p)), { x: rtl ? x1 : x0, y: yNum, size, color: P.ink, align: rtl ? 'right' : 'left', settle: p });
      ctx.fillStyle = P.chrome; rr(ctx, x0, barY, maxW, barH, barH / 2); ctx.fill();
      const ep = M.E(p); if (ep > 0) { ctx.fillStyle = P.accent; rr(ctx, rtl ? x1 - maxW * ep : x0, barY, Math.max(barH, maxW * ep), barH, barH / 2); ctx.fill(); }
      kit.drawText(ctx, label, { x0, x1, y: yLabel, align: 'start', color: P.grey });
      const run = p > 0 && p < 1, endT = t1 + 0.1;
      const jump = M.act([{ t: 0, x: front(1), y: barY }, { t: endT, x: front(1), y: barY, how: 'jump', height: 100 }], t);
      const fx = front(Math.max(0.04, ep)), b = t < endT - 0.1 ? { x: fx, y: barY, air: 0, sq: 0, step: run ? Math.floor(t / 0.08) % 2 : 0, landed: 99 } : jump;
      const cheer = b.landed < 99;
      M.drawBuddy(ctx, B, P, b, { eyes: cheer ? 'happy' : 'open', arms: cheer && Math.floor(b.landed / 0.25) % 2 === 0 ? 'up' : 'down', time: t + clock, flip: rtl });
      M.cursor(ctx, P, path, clicks, t);
      ctx.restore();
    },
  };
}
