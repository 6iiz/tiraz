// Before and after as a smash game on a printed page: the screen turns to a halftone print, the old value is on a card in the upper
// half, a big mallet swings down from the corner and smacks it, the card cracks in two and the halves tumble out; then the new value
// pops up on an accent card over a spinning burst. The label is a dark tag at the top. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, TV = ground.TV;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: 640, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 700, maxW: 640, minPx: 44, where: 'the compare label' }) : null;
  const lw = label ? label.width + 70 : 0, lh = label ? label.height + 22 : 0, lx = W / 2 - lw / 2, ly = TV.y + 50;
  const cw = (f) => Math.min(780, f.width + 120), chh = (f) => f.height + 60;
  const wy = TV.y + 120 + lh + chh(was) / 2, ny = Math.max(wy + chh(was) / 2 + 60 + chh(now) / 2, TV.y + 560);
  const tWas = at + 0.15, tHit = at + 0.95, tNow = at + 1.4;
  const piv = { x: rtl ? TV.x + 40 : TV.x + TV.w - 40, y: TV.y + 40 }, sgn = rtl ? 1 : -1;
  const dots = document.createElement('canvas'); dots.width = TV.w; dots.height = TV.h;
  { const g = dots.getContext('2d'); g.fillStyle = P.dot;
    for (let y = 0, r = 0; y < TV.h; y += 18, r++) for (let x = (r % 2) * 9; x < TV.w; x += 18) { const s = 2 + 4.5 * (y / TV.h); g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); } }
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.in2(span(t, d - 0.3, d));
      ground.screen(ctx, (c) => {
        c.fillStyle = P.tint; c.fillRect(TV.x, TV.y, TV.w, TV.h); c.drawImage(dots, TV.x, TV.y);
        if (label) { const q = M.back(span(t, at, at + 0.3)) * (1 - out);
          if (q > 0) { c.save(); c.translate(W / 2, ly + lh / 2); c.scale(q, q); c.translate(-W / 2, -(ly + lh / 2));
            M.toon(c, M.rect(lx, ly, lw, lh, Math.min(30, lh / 2)), P.d, P, 8, 6);
            kit.drawText(c, label, { x0: lx + 35, x1: lx + lw - 35, y: ly + 11 + label.lead / 2, align: 'center', color: P.l, key: P.l }); c.restore(); } }
        // the old card, whole until the hit, then two halves tumbling out
        const pw = M.back(span(t, tWas, tWas + 0.28)), w = cw(was), h = chh(was), x = W / 2 - w / 2, y = wy - h / 2;
        const card = (cc) => { M.toon(cc, M.rect(x, y, w, h, 18), P.l, P, 10, 7);
          kit.drawText(cc, was, { x0: x + 60, x1: x + w - 60, y: wy - was.height / 2 + was.lead / 2, align: 'center', color: P.d, key: P.d }); };
        if (pw > 0 && t < tHit) { c.save(); c.translate(W / 2, wy); c.scale(pw, pw); c.translate(-W / 2, -wy); card(c); c.restore(); }
        else if (t >= tHit) { const f = t - tHit; if (f < 0.9) for (const side of [-1, 1]) {
          c.save(); c.translate(side * f * 260, f * 120 + 900 * f * f); c.translate(W / 2, wy); c.rotate(side * f * 1.6); c.translate(-W / 2, -wy);
          c.beginPath(); c.moveTo(W / 2, y - 40); for (let k = 0; k <= 6; k++) c.lineTo(W / 2 + (k % 2 ? 22 : -22), y + (h + 80) * k / 6 - 40);
          c.lineTo(side < 0 ? 0 : W, y + h + 40); c.lineTo(side < 0 ? 0 : W, y - 40); c.closePath(); c.clip(); card(c); c.restore(); }
          if (f < 0.35) { c.strokeStyle = P.d; c.lineWidth = 10; c.lineCap = 'round';                    // impact lines
            for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.3, r0 = 120 + f * 300, r1 = r0 + 70; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0 * 1.6, wy + Math.sin(a) * r0 * 0.7); c.lineTo(W / 2 + Math.cos(a) * r1 * 1.6, wy + Math.sin(a) * r1 * 0.7); c.stroke(); } } }
        // the new value: a burst, then the accent card pops up
        const pn = span(t, tNow, tNow + 0.32);
        if (pn > 0) { const q = M.back(pn) * (1 - out), w2 = cw(now), h2 = chh(now);
          M.toon(c, M.star(W / 2, ny, w2 * 0.42 * q, w2 * 0.66 * q, 16, (t + clock) * 0.9), P.l, P, 0, 6);
          c.save(); c.translate(W / 2, ny); c.rotate(-0.035); c.scale(q, q); c.translate(-W / 2, -ny);
          M.toon(c, M.rect(W / 2 - w2 / 2, ny - h2 / 2, w2, h2, 18), P.a, P, 12, 8);
          kit.drawText(c, now, { x0: W / 2 - w2 / 2 + 60, x1: W / 2 + w2 / 2 - 60, y: ny - now.height / 2 + now.lead / 2, align: 'center', color: P.onA, key: P.onA }); c.restore(); }
      });
      // the mallet: swings down from the corner, hits, bounces back up and leaves
      const sw = span(t, tHit - 0.28, tHit), back = span(t, tHit + 0.05, tHit + 0.5);
      if (sw > 0 && back < 1) {
        const ang = sgn * (sw < 1 ? (1 - M.in2(sw)) * 1.3 : M.out3(back) * 1.9);
        const len = Math.hypot(W / 2 - piv.x, wy - piv.y) - 60, a0 = Math.atan2(wy - 40 - piv.y, W / 2 - piv.x);
        ctx.save(); ctx.translate(piv.x, piv.y); ctx.rotate(a0 - ang); ctx.globalAlpha = 1 - back;
        M.toon(ctx, M.rect(0, -16, len, 32, 12), P.l, P, 8, 7);
        M.toon(ctx, M.rect(len - 40, -95, 130, 190, 26), P.a, P, 10, 8);
        ctx.fillStyle = rgba(P.l, 0.5); ctx.fillRect(len - 18, -78, 22, 150);
        ctx.restore();
      }
      ground.fuse(ctx, t, d, at);
    },
  };
}
