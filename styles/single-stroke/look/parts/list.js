// A list on one line: the line climbs the outer margin past the title, then comes down a spine beside the rows and ties a small loop
// at each row on the beat (the row is written as the loop closes). On the row that holds the key phrase it leaves the spine, runs
// under the phrase in the accent and turns back in a hairpin. Then it wanders off. spec: { duration, at?, says: { title?, items: [...] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, indent = 46, tx0 = rtl ? x0 : x0 + indent, tx1 = rtl ? x1 - indent : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(124, rows[0].size * 2.0), titleH = title ? title.height + 40 : 0;
  const top = kit.place(titleH + pitch * items.length, 720);
  const yTitle = title ? top + title.lead / 2 : 0, yRow = (k) => top + titleH + k * pitch + pitch / 2;
  const R = M.line(W, T, rtl), P = R.P, dir = R.dir, mx = R.mx;
  const spine = rtl ? x1 + 18 : x0 - 18, outer = mx(1062);
  R.enter(); P.to(outer, 1250); P.to(outer, top - 10); P.to(mx(1040), top - 40); P.mark('top');
  const bxs = rows.map((f, k) => M.boxes(f, tx0, tx1, yRow(k), 'start', rtl));
  rows.forEach((f, k) => {
    const y = yRow(k);
    P.to(spine, y - 34);
    P.loop(spine - dir * 4, y - 6, 14, 18, rtl ? -Math.PI / 2 : -Math.PI / 2, 1.0, rtl ? 1 : -1); P.mark('b' + k);
    const g = M.keyGroups(bxs[k])[0];
    if (g) {
      const yu = y + f.size * 0.7, far = rtl ? g.x0 - 18 : g.x1 + 18, near = rtl ? g.x1 + 14 : g.x0 - 14;
      P.to(spine - dir * 10, yu); P.to(near, yu + 2, true); P.to((near + far) / 2, yu - 2, true); P.to(far, yu, true);
      P.to(far - dir * 22, yu + 12, true); P.to(far + dir * 6, yu + 22, true); P.to((near + far) / 2, yu + 20, true); P.to(near, yu + 22, true);
      P.to(spine, yu + 26);
    }
  });
  P.to(spine, Math.max(yRow(items.length - 1) + pitch * 0.6, 1150)); P.to(mx(980), 1250).mark('u1');
  R.tail(9);
  const L = R.build(T);
  const beat = Math.min(0.62, Math.max(0.36, (d - 1.4) / (items.length + 0.6)));
  const t0 = (k) => (at < 0 ? at + 0.3 + k * Math.min(beat, (-0.5 - at) / items.length) : at + 0.35 + k * beat);
  const keys = [[at, 0], [t0(0) - 0.15, L.at.top]];
  rows.forEach((_, k) => keys.push([t0(k), L.at['b' + k]]));
  keys.push([t0(items.length - 1) + 0.35, L.at.u1], [Math.max(t0(items.length - 1) + 0.7, d - T.joint), L.total]);
  const tTitle = M.timeAt(keys, L.at.top) - 0.25;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.drawLine(ctx, L, M.headAt(keys, t), K);
      if (title) kit.drawText(ctx, title, { x0, x1, y: yTitle, align: 'start', color: K.grey, each: (w, i, b, c) => M.write(c, t, tTitle + i * 0.07, b, title.size, rtl) });
      rows.forEach((f, k) => kit.drawText(ctx, f, { x0: tx0, x1: tx1, y: yRow(k), align: 'start', color: K.ink, key: K.ink,
        each: (w, i, b, c) => M.write(c, t, t0(k) - 0.05 + i * 0.08, b, f.size, rtl, 0.22) }));
    },
  };
}
