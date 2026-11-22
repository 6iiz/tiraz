// A list laid out on the table: each row is a small stamped tag (a square plate with its number raised on it) and the item cast in
// metal beside it. Rows are let go one per half second in reading order, the tag a moment before its words; a key word is in the
// accent metal. An optional title drops first, a step back in tone. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';
import { THREE } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const S = await import(look.base + 'studio.js'), M = await import(look.base + 'motion.js');
  const x0 = SAFE.left + T.margin, x1 = SAFE.right - T.margin, pal = ground.pal, rtl = kit.rtl;
  const chip = Math.round(T.size.item * 1.04), gutter = 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - chip - gutter, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.label, maxW: x1 - x0, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(118, rows[0].size * 1.78), titleH = title ? title.lead + 36 : 0;
  const top = kit.place(titleH + pitch * items.length, 720);

  const titleP = title ? S.castText(ground, title, { x0, x1, y: top + title.lead / 2, align: 'start', rtl, color: (w) => (w.key ? pal.accent : pal.soft) }) : [];
  titleP.forEach((p, i) => { p.t0 = at + i * 0.05; });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const chipM = S.metal(pal.plate, pal.dark, { rough: 0.4, metalness: 0.75 });
  const lines = items.map((_, k) => {
    const ym = top + titleH + k * pitch + pitch / 2, t0 = at + 0.25 + k * 0.5;
    // the tag: its own materials, so it can fade in with its fall
    const mats = chipM.map((m) => m.clone()), numM = S.metal(pal.light, pal.dark, { rough: 0.26 });
    const g = new THREE.Group();
    const plate = new THREE.Mesh(S.cast(S.plateShape(chip, chip, chip * 0.16), { depth: 12, bevel: 3, key: ['chip', chip].join('|') }), mats);
    plate.castShadow = true; plate.receiveShadow = true; g.add(plate);
    const n = kit.fmt(k + 1), num = new THREE.Mesh(S.cast(S.textShapes(n, { family: mono, weight: 700, size: chip * 0.56 }).shapes, { depth: 6, bevel: 1, key: [mono, 700, chip * 0.56, n].join('|') }), numM);
    num.position.z = 18; num.castShadow = true; g.add(num);
    const cx = rtl ? x1 - chip / 2 : x0 + chip / 2, base = ground.at(cx, ym);
    g.position.copy(base); g.visible = false; ground.scene.add(g);
    const tag = { group: g, mats: [...mats, ...numM], base, up: ground.up(base), half: { x: chip / 2, y: chip / 2 }, seed: k, text: n, t0: t0 - 0.06 };
    const words = S.castText(ground, rows[k], { x0: rtl ? x0 : x0 + chip + gutter, x1: rtl ? x1 - chip - gutter : x1, y: ym, align: 'start', rtl,
      color: (w) => (w.key ? pal.accent : pal.light) });
    words.forEach((p, i) => { p.t0 = t0 + i * 0.05; });
    return { tag, words };
  });
  ground.passes(at + 0.25 + items.length * 0.5 + 0.2, T.light.every, top + (titleH + pitch * items.length) / 2);

  return {
    duration: d,
    draw(ctx, t) {
      for (const p of titleP) M.drop(T, p, t, p.t0);
      for (const l of lines) { M.drop(T, l.tag, t, l.tag.t0, { h0: T.fall.height * 0.8 }); for (const p of l.words) M.drop(T, p, t, p.t0); }
      ground.render(ctx, t);
      for (const p of titleP) M.rec(kit, ground, p);
      for (const l of lines) { M.rec(kit, ground, l.tag, l.tag.text, { decor: true }); for (const p of l.words) M.rec(kit, ground, p); }
    },
  };
}
