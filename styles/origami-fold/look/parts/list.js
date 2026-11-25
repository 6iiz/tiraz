// A list: up to five rows, flush to the reading side. Each row opens on the beat: first a small square tag with its number (mono,
// on the lead paper), then the item's word sheets, each standing up and unfolding out of its pleat. A key word in an item is one
// sheet of the accent's paper and flexes once when it lands. The optional title is a strip above.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, D = T.dur, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 + Math.round(clock * 7) });
  const { E, flex, DEG } = await import(look.base + 'motion.js');
  const maxW = SAFE.right - SAFE.left - 20, rtl = W3.rtl;
  const tagSize = T.size.tag; await document.fonts.load(`600 ${tagSize}px "${brand.fonts.mono?.family ?? brand.fonts.display.family}"`);
  const room = maxW - W3.measure(String(items.length).padStart(2, '0'), { size: tagSize, weight: 600, face: 'mono', whole: true }).width - 24;
  let size = T.size.item;
  for (let tries = 0; tries < 6; tries++) {
    const widest = Math.max(...items.map((it) => W3.measure(it, { size, weight: 700 }).width));
    if (widest <= room) break; size = Math.floor(size * room / widest);
  }
  const rows = [], tags = [];
  for (let k = 0; k < items.length; k++) {
    rows.push(await W3.row(items[k], { size, weight: 700 }));
    tags.push(await W3.row(String(k + 1).padStart(2, '0'), { size: tagSize, weight: 600, face: 'mono', kind: 'lead', whole: true, panels: 2, decor: true }));
  }
  let title = null;
  if (spec.says.title) {
    let ts = T.size.title; const tw = W3.measure(spec.says.title, { size: ts, weight: 600, whole: true }).width;
    if (tw > maxW) ts = Math.max(44, Math.floor(ts * maxW / tw));
    title = await W3.row(spec.says.title, { size: ts, weight: 600, kind: 'lead', whole: true });
  }
  const gT = 36, gR = T.sheet.rowGap + 4, rh = Math.max(...rows.map((r) => r.h));
  const total = (title ? title.h + gT : 0) + rh * rows.length + gR * (rows.length - 1);
  let y = kit.place(total, T.layout.centre);
  const x1 = SAFE.right - 10, x0 = SAFE.left + 10;
  if (title) { title.place({ y, align: 'start', x0, x1 }); y += title.h + gT; }
  rows.forEach((r, k) => {
    const tg = tags[k], ty = y + (rh - tg.h) / 2;
    tg.place({ y: ty, align: 'start', x0, x1 });
    r.place({ y: y + (rh - r.h) / 2, align: 'start', x0: rtl ? x0 : x0 + tg.width + 24, x1: rtl ? x1 - tg.width - 24 : x1 });
    y += rh + gR;
  });
  const u = D.unfold, tRow = (k) => at + 0.22 + k * D.beat;
  return {
    duration: d,
    draw(ctx, t) {
      if (title) title.sheets[0].pose(span(t, at, at + u));
      rows.forEach((r, k) => {
        const r0 = tRow(k);
        tags[k].sheets[0].pose(span(t, r0 - 0.06, r0 - 0.06 + u * 0.8));
        const st = Math.min(0.09, 0.24 / Math.max(1, r.sheets.length - 1));
        r.sheets.forEach((sh, i) => {
          const a = r0 + 0.04 + i * st, p = span(t, a, a + u);
          if (sh.kind === 'key') { const tf = a + u + 0.08, q = span(t, tf, tf + D.flex); sh.pose(p, { flex: flex(q) * T.fold.flex * DEG, z: E(span(t, tf, tf + 0.22)) * T.z.key }); }
          else sh.pose(p);
        });
      });
      W3.draw(ctx, t);
    },
  };
}
