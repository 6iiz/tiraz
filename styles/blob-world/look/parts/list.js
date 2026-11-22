// A list: each row gets its own Pip. It hops in along its row from the far side of the board and stops on the reading side, and the
// item is stamped beside it as it lands. The key item is printed on an accent tape and its Pip beams.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const x0 = SAFE.left, x1 = SAFE.right, indent = 118;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent - M.keyRoom(T.size.item), single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minScale: 0.88, where: 'the list title' }) : null;
  const n = items.length, pitch = Math.max(124, rows[0].size * 1.9), tH = title ? title.height + 30 : 0, block = tH + pitch * n;
  const top = kit.place(block, 700), room = Math.max(0.3, Math.min(0.5, (d - 1.2) / n));
  const land = (k) => at + 0.3 + k * room;
  const ym = (k) => top + tH + k * pitch + pitch / 2;
  const px = kit.rtl ? x1 - 44 : x0 + 44;
  const pips = items.map((it, k) => {
    const key = /\*/.test(it), from = kit.rtl ? -90 : W + 90, y = ym(k) + rows[k].size * 0.55;
    const plan = new M.Plan(from, y).hop(px, y, { at: land(k) - 0.72, n: 4, per: 0.18, h: 30, happy: key });
    if (key) plan.hop(px, y, { at: land(k) + 0.9, n: 1, per: 0.3, h: 28, happy: true });
    return { plan, spr: ground.spr[key ? 0 : (k % 3) + 1], size: 80, seed: k, mood: key ? (tt, st) => (tt > land(k) - 0.05 ? 'happy' : undefined) : undefined };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = Math.max(0, (t - (d - T.dur.out)) / T.dur.out);
      if (title) M.printText(ctx, kit, title, { x0, x1, y: top + title.lead / 2, color: P.grey, P, keyed: false, when: (i) => at + i * 0.06, out, t });
      items.forEach((_, k) => {
        ctx.fillStyle = P.gridB; const rw = (x1 - x0) * M.soft((t - land(k) + 0.1) / 0.4) * (1 - M.soft(out));
        if (rw > 0) ctx.fillRect(kit.rtl ? x1 - rw : x0, ym(k) + pitch / 2 - 1.5, rw, 3);
        M.printText(ctx, kit, rows[k], { x0: kit.rtl ? x0 : x0 + indent, x1: kit.rtl ? x1 - indent : x1, y: ym(k), color: P.ink, P, when: (i) => land(k) + i * 0.05, out, t });
      });
      M.crowd(ctx, pips, t);
    },
  };
}
