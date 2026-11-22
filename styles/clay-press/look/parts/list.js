// A list: an optional title in soft clay, then up to five rows. Each row starts with a small ball of the accent clay pressed flat on
// the reading side; the ball drops first, then the row's words land one pose after another. One row per beat.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { POSE } = await import(look.base + 'motion.js');
  const bullet = T.size.item * 0.62, x0 = SAFE.left + 20, x1 = SAFE.right - 20, textW = x1 - x0 - bullet * 1.6;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW / 1.12, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.75, tH = title ? title.lead + 40 : 0;
  const top = kit.place(tH + pitch * items.length, 720);
  const Tt = title ? await world.text(title, { x0, x1, y: top + title.lead / 2, align: 'start', color: world.soft }) : { rows: [], pieces: [] };
  const R = [];
  for (let k = 0; k < items.length; k++) {
    const ym = top + tH + k * pitch + pitch / 2;
    const bx = kit.rtl ? x1 - bullet / 2 : x0 + bullet / 2;
    const b = world.ball(bullet / 2), set = await world.text(rows[k], kit.rtl ? { x0, x1: x1 - bullet * 1.6, y: ym, align: 'start' } : { x0: x0 + bullet * 1.6, x1, y: ym, align: 'start' });
    R.push({ ball: { obj: b, rest: world.at(bx, ym, 10).setZ(0), i: 50 + k }, set, t0: at + 0.25 + k * T.beat });
  }
  const out = d - 6 * POSE;
  return {
    duration: d,
    draw(ctx, t) {
      world.frame(ctx, t, (tq, k) => {
        const recs = [];
        Tt.pieces.forEach((p, i) => world.drop(p, tq, k, at + i * POSE, { t1: out }));
        recs.push(...Tt.rows.map((r) => [r.pieces.map((p) => p.obj), r.text]));
        R.forEach((r, j) => {
          world.drop(r.ball, tq, k, r.t0 - 2 * POSE, { t1: out + j * POSE * 0.5, amp: 1.4 });
          r.set.pieces.forEach((p, i) => world.drop(p, tq, k, r.t0 - POSE + i * POSE, { t1: out + j * POSE * 0.5, amp: p.key ? 1.6 : 1 }));
          recs.push(...r.set.rows.map((x) => [x.pieces.map((p) => p.obj), x.text]));
        });
        return recs;
      });
    },
  };
}
