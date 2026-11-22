// A list is a chain of wheels down the far edge on the reading side, one wheel per item, each meshing with the one above. On each beat
// a wheel slides in, is dyed from the tooth where it meets its neighbour, and joins the turning chain (neighbours turn opposite ways);
// its item clicks in beside it. Wheels take the system colours in turn; the item with a key word gets the accent wheel and its key
// words sit on an accent chip. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, n = items.length;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  const yTitle = SAFE.top + 30 + (title ? title.lead / 2 : 0), yTop = title ? yTitle + title.lead / 2 + 40 : SAFE.top + 40;
  const pitch = Math.min(170, (SAFE.bottom - yTop) / n), Nt = 14, m = pitch / Nt;
  const gx = rtl ? W - 96 : 96, r = pitch / 2;
  const tx0 = rtl ? SAFE.left : gx + r + m + 34, tx1 = rtl ? gx - r - m - 34 : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const yRow = (k) => yTop + pitch * (k + 0.5);
  const tr = M.train(m, { N: Nt, x: gx, y: yRow(0) }, items.slice(1).map(() => ({ N: Nt, phi: Math.PI / 2 })));
  const keyItem = items.findIndex((s) => /\*/.test(s)), cycle = [pal.B, pal.C, pal.N];
  let ci = 0; const sys = items.map((_, k) => (k === keyItem ? pal.A : cycle[ci++ % 3]));
  const t0 = (k) => at + 0.25 + k * 0.5, out0 = d - T.dur.out;
  const boxes = rows.map((rw, k) => M.boxes(kit, rw, tx0, tx1, yRow(k)));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d), A = tr.angles(t * T.drive.speed * 1.4 * (rtl ? 1 : -1));
      ctx.save(); ctx.globalAlpha = 1 - q;
      tr.g.forEach((g, k) => {
        const p = M.smooth(span(t, t0(k) - 0.3, t0(k)));
        if (p <= 0) return;
        const dx = (1 - p) * (rtl ? 260 : -260);
        const dye = k === 0 ? { x: g.x, y: g.y, r: 400 * M.smooth(span(t, t0(k) - 0.1, t0(k) + 0.4)) } : { x: g.x, y: g.y - r, r: 2.4 * r * M.smooth(span(t, t0(k) - 0.05, t0(k) + 0.45)) };
        M.drawGear(ctx, g.G, g.x + dx, g.y, A[k], sys[k], { neutral: pal.N, dye: { ...dye, x: dye.x + dx } });
      });
      ctx.restore();
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.click(c, t, at + i * 0.05, T.dur.word, out0, d, box) === false) return false; } });
      items.forEach((_, k) => {
        const kp = span(t, t0(k) + 0.1, t0(k) + 0.35);
        ctx.save(); ctx.globalAlpha = 1 - q; M.keyRuns(boxes[k]).forEach((run) => M.chip(ctx, pal, run, rows[k].size, kp, rtl)); ctx.restore();
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: yRow(k), align: 'start', color: pal.ink,
          each: (w, i, box, c) => { if (M.click(c, t, t0(k) + i * 0.05, T.dur.word, out0, d, box) === false) return false; if (w.key) return M.keyInk(pal, kp); } });
      });
    },
  };
}
