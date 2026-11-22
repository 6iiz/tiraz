// A number as a button-mashing game on an old pocket LCD: the screen turns to liquid crystal with a faint dot grid, the big arcade
// button below is hammered six times, and with each press the seven-segment value jumps a step (unlit segments show as ghosts) until
// it lands on the real value with a burst. The label is a card under the digits. spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, TV = ground.TV;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const full = text(S.value), seg = M.canSeg(full);
  let h = T.size.seg; if (seg) while (M.segWidth(full, h) > 700 && h > 90) h -= 6;
  let nsize = T.size.seg; if (!seg) while (kit.numberWidth(full, nsize, 900, 1) > 700 && nsize > 80) nsize -= 6;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: 700, minPx: 44, where: 'the count label' });
  const yNum = 400, nh = seg ? h : nsize, lw = Math.min(820, label.width + 90), lh = label.height + 34, ly = yNum + nh + 70;
  const presses = 6, p0 = at + 0.3, p1 = at + 1.5, step = (p1 - p0) / (presses - 1), bx = W / 2, by = Math.min(1060, ly + lh + 120);
  const grid = document.createElement('canvas'); grid.width = TV.w; grid.height = TV.h;
  { const g = grid.getContext('2d'); g.fillStyle = rgba(P.d, 0.05); for (let y = 0; y < TV.h; y += 7) g.fillRect(0, y, TV.w, 2); for (let x = 0; x < TV.w; x += 7) g.fillRect(x, 0, 2, TV.h); }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const k = t < p0 ? 0 : Math.min(presses, 1 + Math.floor((t - p0) / step)), v = k >= presses ? S.value : (S.value * k) / presses;
      const str = text(spec.decimals ? v : Math.round(v)), landed = k >= presses, pressT = p0 + (k - 1) * step;
      const down = k > 0 && t - pressT < 0.09;
      ground.screen(ctx, (c) => {
        c.fillStyle = P.lcd; c.fillRect(TV.x, TV.y, TV.w, TV.h); c.drawImage(grid, TV.x, TV.y);
        c.fillStyle = rgba(P.d, 0.08); c.fillRect(TV.x, TV.y, TV.w, 26);
        if (landed && t < p1 + 0.6) { const q = M.out3(span(t, p1, p1 + 0.35)); M.toon(c, M.star(W / 2, yNum + nh / 2, 120 + 200 * q, 230 + 280 * q, 14, t * 0.6), P.tint, P, 0, 5); }
        if (seg) { const wv = M.segWidth(str, h), x = W / 2 - wv / 2;
          M.segText(c, str, x, yNum, h, P.d, rgba(P.d, 0.07)); kit.rec(x, x + wv, yNum, yNum + h, str); }
        else kit.number(c, str, { x: W / 2, y: yNum + nh / 2, size: nsize, color: P.d, align: 'center' });
      });
      ground.fuse(ctx, t, d, at);
      const cin = M.back(span(t, at + 0.15, at + 0.45)), out = M.in2(span(t, d - 0.3, d));
      if (cin > 0 && out < 1) {
        ctx.save(); ctx.translate(W / 2, ly + lh / 2); ctx.scale(cin * (1 - out), cin * (1 - out)); ctx.rotate(0.02); ctx.translate(-W / 2, -(ly + lh / 2));
        M.toon(ctx, M.rect(W / 2 - lw / 2, ly, lw, lh, 20), P.l, P, 10, 7);
        kit.drawText(ctx, label, { x0: W / 2 - lw / 2 + 45, x1: W / 2 + lw / 2 - 45, y: ly + 17 + label.lead / 2, align: 'center', color: P.d, key: P.d });
        ctx.restore();
      }
      // the arcade button: dark base, accent cap; it sinks while pressed
      const sink = down ? 14 : 0;
      M.toon(ctx, (c) => c.ellipse(bx, by + 40, 150, 50, 0, 0, Math.PI * 2), P.d, P, 0, 6);
      M.toon(ctx, (c) => { c.ellipse(bx, by + sink, 120, 42, 0, 0, Math.PI * 2); }, P.a, P, 0, 7);
      ctx.fillStyle = P.a; ctx.fillRect(bx - 116, by + sink, 232, 36 - sink); ctx.lineWidth = 7; ctx.strokeStyle = P.d;
      ctx.beginPath(); ctx.moveTo(bx - 120, by + sink); ctx.lineTo(bx - 120, by + 38); ctx.moveTo(bx + 120, by + sink); ctx.lineTo(bx + 120, by + 38); ctx.stroke();
      M.toon(ctx, (c) => c.ellipse(bx, by + sink, 120, 42, 0, 0, Math.PI * 2), P.a, P, 0, 7);
      ctx.fillStyle = rgba(P.l, 0.55); ctx.beginPath(); ctx.ellipse(bx - 40, by + sink - 12, 36, 10, -0.2, 0, Math.PI * 2); ctx.fill();
      if (down) { ctx.strokeStyle = P.d; ctx.lineWidth = 8; ctx.lineCap = 'round';
        for (const a of [-2.5, -2.0, -1.1, -0.6]) { ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * 160, by + Math.sin(a) * 90); ctx.lineTo(bx + Math.cos(a) * 205, by + Math.sin(a) * 120); ctx.stroke(); } }
    },
  };
}
