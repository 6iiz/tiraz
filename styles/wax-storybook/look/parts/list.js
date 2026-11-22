// A list as a picture book's little inventory: each item gets a small crayon picture on the reading side (a star, a flower, a heart,
// a sun, a leaf), outlined in the dark wax and coloured in with the accent, and its words are printed beside it. One item per beat:
// first the picture is drawn, then the words are written in. A key word is coloured over like the line's. The title is printed in grey
// with a wavy crayon underline. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, K = M.masks(W, H);
  const pic = 74, indent = pic + 40, textW = SAFE.right - SAFE.left - indent - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left - 40, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(132, rows[0].size * 1.95), head = title ? title.lead + 56 : 0;
  const top = kit.place(head + pitch * items.length, 720);
  const px = rtl ? SAFE.right - pic / 2 - 6 : SAFE.left + pic / 2 + 6;
  const x0 = rtl ? SAFE.left + 20 : SAFE.left + indent, x1 = rtl ? SAFE.right - indent : SAFE.right - 20;
  const probe = document.createElement('canvas').getContext('2d');
  const keys = rows.map((f, k) => { const ks = []; kit.drawText(probe, f, { x0, x1, y: 0, align: 'start', each: (w, i, box) => { if (w.key) ks.push(box); return false; } }); return ks; });
  // the little pictures: a closed outline (points) for each kind, round a centre, radius r
  const shape = (k, cx, cy, r) => {
    const out = [], n = 40;
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2; let rr = r;
      if (k === 0) rr = r * (i % 8 < 4 ? 1 : 0.5) * (1 - 0.0 * i);                     // a star (5 points, rough)
      if (k === 1) rr = r * (0.62 + 0.38 * Math.abs(Math.cos(a * 2.5)));                 // a flower
      if (k === 3) rr = r * 0.78;                                                         // a sun disc (rays drawn apart)
      let x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (k === 2) { const s = a + Math.PI / 2, hx = 16 * Math.sin(s) ** 3, hy = -(13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)); x = cx + hx * r / 17; y = cy + hy * r / 17 - r * 0.1; }
      if (k === 4) { const s = a + Math.PI / 2; x = cx + Math.sin(s) * r * 0.55; y = cy - Math.cos(s) * r * Math.abs(Math.cos(s * 0.5)) * 1.0; }
      out.push([x, y]);
    }
    if (k === 0) { const st = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? r * 0.46 : r; st.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return st; }
    return out;
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const b = ground.boil(t);
      let y = top;
      if (title) {
        const yt = y + title.lead / 2;
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yt, align: 'start', color: P.grey,
          each: (w, i, box, c) => M.write(c, span(t, at + i * T.dur.gap, at + i * T.dur.gap + T.dur.word), box, title.size, rtl) });
        const u = span(t, at + 0.25, at + 0.6);
        if (u > 0) M.wax(ctx, K.mid, [SAFE.left, yt + title.size * 0.4, SAFE.right - SAFE.left, 50], (c) => {
          const wv = [], x1t = rtl ? SAFE.right : SAFE.left + title.width, x0t = rtl ? SAFE.right - title.width : SAFE.left;
          for (let j = 0; j <= 18; j++) wv.push([rtl ? x1t - (title.width * j) / 18 : x0t + (title.width * j) / 18, yt + title.size * 0.7 + Math.sin(j * 1.2) * 5]);
          M.stroke(c, wv, 6, P.deep, b * 11, u);
        });
        y += head;
      }
      items.forEach((_, k) => {
        const t0 = at + 0.15 + k * T.dur.beat, ym = y + k * pitch + pitch / 2, kind = k % 5;
        const pd = span(t, t0, t0 + T.dur.draw), pc = span(t, t0 + 0.1, t0 + T.dur.draw + 0.15);
        if (pd > 0) {
          M.wax(ctx, K.heavy, [px - pic, ym - pic, pic * 2, pic * 2], (c) => {
            const o = shape(kind, px, ym, pic / 2);
            M.colour(c, M.shapeOf(o), [px - pic / 2 - 6, ym - pic / 2 - 6, pic + 12, pic + 12], P.accent, pc, b * 13 + k, 0.8, 9);
            M.stroke(c, o, 5, P.ink, b * 19 + k, pd);
            if (kind === 3) for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, q = span(pd, 0.6, 1); if (q > 0) M.stroke(c, [[px + Math.cos(a) * pic * 0.5, ym + Math.sin(a) * pic * 0.5], [px + Math.cos(a) * pic * 0.66, ym + Math.sin(a) * pic * 0.66]], 4, P.ink, b + i, q); }
          });
        }
        const tw = t0 + 0.22;
        for (const kb of keys[k]) {
          const p = span(t, tw + 0.25, tw + 0.25 + T.dur.scribble); if (p <= 0) continue;
          const s = rows[k].size, x = kb.x - s * 0.13, yy = ym - s * 0.5, w = kb.width + s * 0.26, h = s * 1.05;
          M.wax(ctx, K.mid, [x - 20, yy - 20, w + 40, h + 40], (c) => { const bl = new Path2D(); bl.roundRect(x, yy, w, h, h * 0.4); M.colour(c, bl, [x, yy, w, h], P.key, M.E(p), b * 29 + k, rtl ? 2.6 : -0.5, 11); });
        }
        kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => M.write(c, span(t, tw + i * 0.06, tw + i * 0.06 + T.dur.word), box, rows[k].size, rtl) });
      });
    },
  };
}
