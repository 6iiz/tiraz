// A list is a parts list: one layer of the device for each item. The device stands on the side away from the reading side, seated;
// on each beat its top-most seated layer lifts to its place, and the item's name is set beside it on the end of a leader. The item
// with a key word is the accent part. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, M0 = T.model;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const n = items.length, rtl = kit.rtl;
  const textW = 500, lx0 = rtl ? SAFE.right - textW : SAFE.left, lx1 = rtl ? SAFE.right : SAFE.left + textW;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  const yTitle = SAFE.top + 20 + (title ? title.lead / 2 : 0), yTop = title ? yTitle + title.height - title.lead / 2 + 70 : SAFE.top + 60;
  const pitch = Math.min(190, (1200 - yTop) / n), yRow = (k) => yTop + pitch * (k + 0.5);
  const keyItem = items.findIndex((x) => /\*/.test(x));
  const kinds = n === 1 ? ['base', 'lid'] : M.kindsFor(n), L = kinds.length;
  // item k is layer L-1-k (the top layer is the first item)
  const dev = M.makeDevice(pal, { kinds, chip: false, accentLayer: keyItem >= 0 ? L - 1 - keyItem : -1, U: 500, V: 320, seed: 3 });
  const s = 0.6, gap = pitch / s, cx = rtl ? SAFE.left + 210 : SAFE.right - 210;
  // put the floor so that layer i, when apart, has its leader point level with its row
  const P0 = M.view(M0.theta, s, cx, 0, M0.squash), side = rtl ? 1 : -1;
  const anchor = (P, i, h) => { const c = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => P.pt(a * dev.U / 2 * 0.9, b * dev.V / 2 * 0.9, h)); return c.reduce((m, q) => (q[0] * side > m[0] * side ? q : m)); };
  const off = anchor(P0, 0, 0)[1];
  const cy = yRow(n - 1) - off + dev.layers[L - n].thick * s;
  const t0 = (k) => at + 0.25 + k * 0.5, out0 = d - T.dur.out;
  const boxes = rows.map((r, k) => M.boxes(kit, r, lx0, lx1, yRow(k)));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const close = M.E(span(t, d - 0.5, d - 0.08));
      const P = M.view(M0.theta + M0.turn * 0.6 * t, s, cx, cy, M0.squash);
      const lift = (i) => { const k = L - 1 - i; if (k >= n) return 0; return M.E(span(t, t0(k) - 0.3, t0(k) + 0.12)) * (1 - close); };
      const hs = dev.layers.map((Ly, i) => Ly.seat + ((L - 1 - i < n ? (n - 1 - (L - 1 - i)) * gap : 0) + Ly.thick - Ly.seat) * lift(i));
      M.drawDevice(ctx, dev, P, hs);
      const q = span(t, out0, d);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.settle(c, t, at + i * 0.05, T.dur.word, out0, d) === false) return false; } });
      items.forEach((_, k) => {
        const i = L - 1 - k, [ax, ay] = anchor(P, i, hs[i]), y = yRow(k);
        const ex = rtl ? lx0 + textW - rows[k].width - 26 : lx1 - textW + rows[k].width + 26;
        const pl = span(t, t0(k) - 0.05, t0(k) + 0.2) * (1 - span(t, d - 0.55, d - 0.35));
        M.leader(ctx, [[ax, ay], [ax + side * 30, y], [ex, y]], pl, pal.wire, keyItem >= 0 && i === L - 1 - keyItem ? pal.accent : pal.light);
        ctx.save(); ctx.globalAlpha = 1 - q;
        M.keyRuns(boxes[k]).forEach((r) => M.bracket(ctx, r, rows[k].size, pal.key, span(t, t0(k) + 0.1, t0(k) + 0.35), rtl));
        ctx.restore();
        kit.drawText(ctx, rows[k], { x0: lx0, x1: lx1, y, align: 'start', color: pal.light, key: pal.key,
          each: (w, j, box, c) => { if (M.settle(c, t, t0(k) + j * 0.04, T.dur.word, out0, d) === false) return false; } });
      });
    },
  };
}
