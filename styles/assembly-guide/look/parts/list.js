// A list as the manual's sequence: each row gets a ringed number on the reading side (the ring is ruled round, then the number sits in
// it) and its words slide in along the isometric axis, one row per beat; a key phrase sits on a dropped slab of the accent. The build
// grows below. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K, n = M.nextStep(clock), R = M.rig(W, T, K);
  const x0 = SAFE.left, x1 = SAFE.right, ring = 27, indent = ring * 2 + 30;
  const tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 30, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0 - 140, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(112, rows[0].size * 1.9), titleH = title ? title.height + 24 : 0;
  const top = Math.max(430, kit.place(titleH + pitch * items.length, 700)) - (title ? 0 : 0);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const beat = Math.min(0.6, Math.max(0.34, (d - 1.3) / (items.length + 0.5)));
  const t0 = (k) => (at < 0 ? at + 0.15 + k * Math.min(beat, 0.5 / items.length) : at + 0.3 + k * beat);
  const yRow = (k) => top + titleH + k * pitch + pitch / 2;
  const groups = rows.map((f, k) => M.keyGroups(M.boxes(f, tx0, tx1, yRow(k), 'start', rtl)));
  const yTitle = top + (title ? title.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.stepNumber(ctx, kit, n, rtl ? x1 : x0, 330, T.size.step * 0.8, K.ink, (t - at) / 0.3, rtl);
      if (title) kit.drawText(ctx, title, { x0, x1, y: yTitle, align: 'start', color: K.grey, each: (w, i, b, c) => M.arrive(c, (t - at - i * 0.05) / 0.3, rtl, title.size) });
      rows.forEach((f, k) => {
        const ym = yRow(k), cx = rtl ? x1 - ring : x0 + ring, s = t0(k), pr = M.E(M.clamp((t - s) / 0.3));
        if (pr > 0) {
          ctx.save(); ctx.strokeStyle = K.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, ym, ring, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); ctx.stroke();
          if (pr > 0.6) { ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = K.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(String(k + 1), cx, ym + 1);
            kit.rec(cx - ring, cx + ring, ym - ring, ym + ring, String(k + 1), { decor: true }); }
          ctx.restore();
        }
        const offs = groups[k].map((g) => M.slab(ctx, g, (t - s - 0.12) / 0.35, K, T, rtl));
        kit.drawText(ctx, f, { x0: tx0, x1: tx1, y: ym, align: 'start', color: K.ink, key: K.onAccent,
          each: (w, i, b, c) => {
            const gi = groups[k].findIndex((g) => i >= g.firstI && i <= g.lastI);
            if (gi >= 0) { if (offs[gi] === null || t < s + 0.42) return false; c.translate(0, offs[gi]); return; }
            return M.arrive(c, (t - s - 0.05 - i * 0.06) / 0.3, rtl, f.size);
          } });
      });
      R.draw(ctx, n, t, Math.max(at + 0.3, 0.25));
    },
  };
}
