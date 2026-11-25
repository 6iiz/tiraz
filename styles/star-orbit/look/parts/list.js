// A list: a small system of moons. Each item has its own moon at the reading side, with a thin orbit round it; on every beat the
// next moon swings in and the item's words orbit in beside it and settle, flush to the reading side. A key word in an item gets
// the key colour and its ring. The optional title comes in from deep space above the list.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 4 + Math.round(clock * 3) });
  const { E, S } = await import(look.base + 'motion.js');
  const THREE = W3.THREE, P = W3.P, rtl = W3.rtl;
  const fit = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: SAFE.right - SAFE.left - 150, single: true, where: 'a list item' });
  const size = fit[0].size, rb = Math.round(size * T.list.moon), gap = size * 1.72;
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 20, single: true, where: 'the list title' }) : null;
  const hT = title ? title.size * 1.9 : 0, top = kit.place(hT + items.length * gap, 720);
  let tRow = null;
  if (title) { tRow = await W3.row(spec.says.title, { size: title.size, weight: T.weight.lead, depth: T.depth.lead, color: P.lead, rings: false }); W3.place(tRow, { y: top + title.size * 0.6, align: 'start' }); }
  const bx = rtl ? SAFE.right - rb - 8 : SAFE.left + rb + 8, tx0 = rtl ? SAFE.left : bx + rb + 34, tx1 = rtl ? bx - rb - 34 : SAFE.right;
  const ringM = new THREE.MeshBasicMaterial({ color: P.side, transparent: true, opacity: 0.8, toneMapped: false });
  const rows = [];
  for (let k = 0; k < items.length; k++) {
    const y = top + hT + gap * (k + 0.5), t0 = at + 0.3 + k * T.list.beat;
    const r = await W3.row(items[k], { size, weight: T.weight.item, maxW: tx1 - tx0 });
    W3.place(r, { y, x0: tx0, x1: tx1, align: 'start' });
    const moon = W3.moon(rb); moon.position.set(W3.wx(bx), W3.wy(y), 0); W3.scene.add(moon);
    const orb = new THREE.Mesh(new THREE.TorusGeometry(rb * 1.6, 1.4, 6, 96), ringM); orb.position.copy(moon.position); orb.rotation.set(-1.15, 0, 0.25 * W3.dir); W3.scene.add(orb);
    rows.push({ r, moon, orb, y, t0 });
  }
  return {
    duration: d,
    draw(ctx, t) {
      if (tRow) W3.arrive(tRow, t, { t0: at, dur: 0.38 });
      rows.forEach(({ r, moon, orb, y, t0 }, k) => {
        const p = E(span(t, t0 - 0.12, t0 + 0.3));
        const a = (1 - p) * 2.4;                                       // the moon swings in on an arc from above the reading side
        moon.visible = p > 0; moon.scale.setScalar(Math.max(0.001, rb * (0.4 + 0.6 * p)));
        moon.position.set(W3.wx(bx) + W3.dir * -Math.sin(a) * 160 * (1 - p), W3.wy(y) + (1 - Math.cos(a)) * 120, -(1 - p) * 500);
        moon.rotation.y = t * 0.6 + k;
        const o = S(span(t, t0 + 0.15, t0 + 0.45)); orb.visible = o > 0.01; orb.scale.setScalar(Math.max(0.001, o));
        W3.fly(r, t, { t0, window: 0.62, travel: 0.4, rx: 200, rz: 320 });
      });
      W3.render(ctx, t);
    },
  };
}
