// A list as a swatch card: each item starts with a short square dab of the pigment on the reading side, the dabs graded from a pale
// glaze to a full one down the list as on a painter's test sheet; the brush then carries on into the row and the words develop behind
// it. An item with a key word gets the strongest dab and a stroke of pigment under its key words.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl, n = items.length;
  if (!Array.isArray(items) || !n || n > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const sw = 74, indent = sw + 40;
  const tx0 = rtl ? SAFE.left + 10 : SAFE.left + indent, tx1 = rtl ? SAFE.right - indent : SAFE.right - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead * 1.3, 116), head = title ? title.lead + 46 : 0;
  const top = kit.place(head + pitch * n, 720), y0 = top + head;
  const keyed = items.map((s) => /\*[^*]+\*/.test(s)), keyInk = pal.on(pal.tint(0.75)), grey = pal.quiet(T.tone.grey);
  const L = items.map((_, k) => {
    const ym = y0 + k * pitch + pitch / 2, t0 = at + 0.25 + k * T.beat;
    const strength = keyed[k] ? 0.9 : 0.22 + 0.5 * (n > 1 ? k / (n - 1) : 0.5);
    const sx = rtl ? SAFE.right - sw : SAFE.left;
    const bx = M.boxes(rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', rtl });
    const keys = M.keySpans(bx).map((s, j) => { const w = s.x1 - s.x0 + rows[k].size * 0.5; return { B: M.band(w, rows[k].size * 1.05, pal.accent, T.tone.key, 80 + k * 3 + j, rtl), x: s.x0 - rows[k].size * 0.25, w, y: s.y }; });
    return { ym, t0, sx, bx, keys, dab: M.band(sw, sw * 0.82, pal.accent, strength, 70 + k, rtl) };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: grey,
        each: (w, i, box, c) => M.develop(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.dry), out, pal.wet, grey) });
      L.forEach((R, k) => {
        M.lay(ctx, R.dab, R.sx, R.ym, M.BR(span(t, R.t0 - 0.12, R.t0 + 0.12)), rtl, keep);
        for (const K of R.keys) M.lay(ctx, K.B, K.x, K.y, M.BR(span(t, R.t0 + 0.15, R.t0 + 0.5)), rtl, keep);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: R.ym, align: 'start', color: pal.ink, key: keyInk,
          each: (w, i, box, c) => { const q0 = R.t0 + 0.08 + i * 0.07; return M.develop(c, span(t, q0, q0 + T.dur.dry), span(t, d - T.dur.out + k * 0.03, d), pal.wet, w.key ? keyInk : pal.ink); } });
      });
    },
  };
}
