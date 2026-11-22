// Before and after, as a child corrects a page: the old word is printed in grey, then scratched out with a dense dark crayon scribble
// that runs across it from the reading side; a curly crayon arrow is drawn down from it, and the new word is printed large, coloured
// over with the accent and underlined. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, K = M.masks(W, H);
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left - 120;
  const was = kit.fit(asText(S.was).replace(/\*/g, ''), { size: T.size.compare * 0.8, weight: 700, maxW, minScale: 0.6, where: 'the old value' });
  const now = kit.fit(asText(S.now).replace(/\*/g, ''), { size: T.size.compare, weight: 800, maxW, minScale: 0.6, where: 'the new value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left - 40, single: true, where: 'the compare label' }) : null;
  const yLabel = 430, yWas = 590, yNow = 900, cx = W / 2;
  const tWas = at + 0.15, tCut = at + 0.75, tArrow = at + 1.15, tNow = at + 1.4, tCol = tNow + 0.3;
  const ww = Math.min(was.width, SAFE.right - SAFE.left), nwid = now.width;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = ground.boil(t);
      if (label) kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: P.grey,
        each: (w, i, box, c) => M.write(c, span(t, at + i * T.dur.gap, at + i * T.dur.gap + T.dur.word), box, label.size, rtl) });
      kit.drawText(ctx, was, { x0: SAFE.left, x1: SAFE.right, y: yWas - was.height / 2 + was.lead / 2, align: 'center', color: P.grey,
        each: (w, i, box, c) => M.write(c, span(t, tWas + i * T.dur.gap, tWas + i * T.dur.gap + T.dur.word), box, was.size, rtl) });
      const pc = span(t, tCut, tCut + 0.4);
      if (pc > 0) {
        const x = cx - ww / 2 - 26, y = yWas - was.height / 2 + was.size * 0.12, w = ww + 52, h = was.height - was.size * 0.25;
        M.wax(ctx, K.heavy, [x - 20, y - 20, w + 40, h + 40], (c) => {
          c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
          M.stroke(c, M.zigzag(x, y, w, h, rtl ? Math.PI / 2 : -Math.PI / 2, 17, b * 3 + 1), 11, P.ink, b * 3 + 2, pc, 3);
          c.restore();
        });
      }
      const pa = span(t, tArrow, tArrow + 0.35);
      if (pa > 0) M.wax(ctx, K.heavy, [cx - 140, yWas + 50, 280, yNow - yWas - 60], (c) => {
        const y0 = yWas + was.height / 2 + 6, y1 = yNow - now.height / 2 - 6, pts = [];
        for (let j = 0; j <= 14; j++) { const u = j / 14; pts.push([cx + Math.sin(u * Math.PI * 1.6) * 46 * (rtl ? 1 : -1), y0 + (y1 - y0) * u]); }
        M.stroke(c, pts, 8, P.deep, b * 5, pa);
        const q = span(pa, 0.8, 1), e = pts.at(-1);
        if (q > 0) { M.stroke(c, [[e[0] - 34, e[1] - 32], e], 8, P.deep, b * 5 + 1, q); M.stroke(c, [[e[0] + 34, e[1] - 32], e], 8, P.deep, b * 5 + 2, q); }
      });
      const pk = span(t, tCol, tCol + T.dur.scribble);
      if (pk > 0) {
        const s = now.size, x = cx - nwid / 2 - s * 0.24, y = yNow - now.height / 2 + s * 0.08, w = nwid + s * 0.48, h = now.height - s * 0.16;
        M.wax(ctx, K.mid, [x - 30, y - 30, w + 60, h + 100], (c) => {
          const bl = new Path2D(); bl.roundRect(x, y, w, h, Math.min(h, s * 1.1) * 0.4);
          M.colour(c, bl, [x, y, w, h], P.key, M.E(pk), b * 23, rtl ? 2.6 : -0.5, 13);
          const u = span(pk, 0.5, 1), yy = y + h + 16, wave = [];
          for (let j = 0; j <= 18; j++) wave.push([rtl ? x + w - (w * j) / 18 : x + (w * j) / 18, yy + Math.sin(j * 1.25) * 6]);
          M.stroke(c, wave, 8, P.deep, b * 9, u);
        });
      }
      kit.drawText(ctx, now, { x0: SAFE.left, x1: SAFE.right, y: yNow - now.height / 2 + now.lead / 2, align: 'center', color: P.ink, key: P.ink,
        each: (w, i, box, c) => M.write(c, span(t, tNow + i * T.dur.gap, tNow + i * T.dur.gap + T.dur.word), box, now.size, rtl) });
    },
  };
}
