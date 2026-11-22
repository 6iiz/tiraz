// A number on a stamped metal plate: a heavy plate in a metal mixed from the brand's dark and light lands on the table with its
// digits raised in the accent metal; the digits roll up to the value like a counter (one value a frame, slowing at the end), and
// when the value lands the plate is struck once and rings while the soft light passes over it. The label drops in under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, countValue, hasArabic, SAFE } from '/engine/kit.js';
import { THREE } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, Sx = spec.says, dec = spec.decimals ?? 0;
  if (typeof Sx.value !== 'number') throw new Error('the count spec\'s "value" must be a number');
  const ground = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const S = await import(look.base + 'studio.js'), M = await import(look.base + 'motion.js');
  const x0 = SAFE.left + T.margin, x1 = SAFE.right - T.margin, maxW = x1 - x0, pal = ground.pal;
  const fam = brand.fonts.display.family, final = kit.fmt(Sx.value, dec);

  // the characters the counter can show, and what sits around the number
  const chars = [...new Set([...Array.from({ length: 10 }, (_, i) => kit.fmt(i)), ...final, ...kit.fmt(-1.5, 1)])];
  const extraOf = (s) => (s ? { s, small: hasArabic(s) || s.length > 2 } : null);
  const pre = extraOf(Sx.prefix), suf = extraOf(Sx.suffix);
  let size = T.size.count, glyph, cell, numW, preW, sufW, pw;
  const measure = () => {
    glyph = new Map(chars.map((c) => [c, S.textShapes(c, { family: fam, weight: 900, size })]));
    cell = Math.max(...[...glyph.entries()].filter(([c]) => /[0-9٠-٩]/.test(c)).map(([, g]) => g.width));
    const wOf = (c) => (/[0-9٠-٩]/.test(c) ? cell : glyph.get(c).width);
    numW = [...final].reduce((s, c) => s + wOf(c), 0);
    const ex = (e) => (e ? S.textShapes(e.s, { family: fam, weight: 800, size: e.small ? size * 0.4 : size * 0.8 }).width + size * 0.08 : 0);
    preW = ex(pre); sufW = ex(suf); pw = numW + preW + sufW + size * 0.56;
    return wOf;
  };
  let wOf = measure();
  while (pw > maxW && size > 90) { size -= 10; wOf = measure(); }
  const ph = size * 1.16, cy = 560, plateD = Math.max(18, size * 0.11), bev = Math.max(3, size * 0.02);

  // the plate and its raised digits, one group, so it falls as one piece
  const group = new THREE.Group(), plateM = S.metal(pal.plate, pal.dark, { rough: 0.38, metalness: 0.75 }), digitM = S.metal(pal.accent, pal.dark, { rough: 0.24, metalness: 0.7 });
  const plate = new THREE.Mesh(S.cast(S.plateShape(pw, ph, Math.min(40, ph * 0.18)), { depth: plateD, bevel: bev }), plateM);
  plate.castShadow = true; plate.receiveShadow = true; group.add(plate);
  const onTop = plateD + 2 * bev, depth = Math.max(8, size * 0.09), dBev = Math.max(1, size * 0.012);
  const numLeft = -pw / 2 + size * 0.28 + preW, numRight = numLeft + numW;
  const cells = [];
  for (let k = 0; k < final.length + 1; k++) {
    const cg = new THREE.Group(), meshes = new Map();
    for (const c of chars) {
      const m = new THREE.Mesh(S.cast(glyph.get(c).shapes, { depth, bevel: dBev, key: [fam, 900, size, c].join('|') }), digitM);
      m.castShadow = true; m.visible = false; cg.add(m); meshes.set(c, m);
    }
    cg.position.z = onTop; group.add(cg); cells.push({ cg, meshes });
  }
  const sideText = (e, x) => {
    if (!e) return;
    const sz = e.small ? size * 0.4 : size * 0.8, m = new THREE.Mesh(S.cast(S.textShapes(e.s, { family: fam, weight: 800, size: sz }).shapes, { depth, bevel: dBev }), digitM);
    m.position.set(x, e.small ? -size * 0.12 : 0, onTop); m.castShadow = true; group.add(m);
  };
  sideText(pre, numLeft - preW / 2); sideText(suf, numRight + sufW / 2);
  const base = ground.at(W / 2, cy); group.position.copy(base); group.visible = false; ground.scene.add(group);
  const piece = { group, mats: [...plateM, ...digitM], base, up: ground.up(base), half: { x: pw / 2, y: ph / 2 }, seed: 1, text: final };

  const label = kit.fit(Sx.label, { size: T.size.label, weight: T.weight.label, maxW, where: 'the count label' });
  const yLabel = cy + ph / 2 + 70 + label.lead / 2;
  const labelP = S.castText(ground, label, { x0, x1, y: yLabel, rtl: kit.rtl, color: (w) => (w.key ? pal.accent : pal.soft) });
  labelP.forEach((p, i) => { p.t0 = at + 0.55 + i * M.gap(T, labelP.length); });
  const c0 = at + 0.36, c1 = at + 1.45;                       // the count runs between these; the strike lands at c1
  ground.passes(c1 + 0.05, T.light.every, cy);

  const show = (str) => {                                     // right-aligned in the cells of the final value
    let x = numRight; const s = [...str];
    cells.forEach((c, k) => {
      const ch = s[s.length - 1 - k];
      for (const [cc, m] of c.meshes) m.visible = cc === ch;
      if (ch) { const w = wOf(ch); c.cg.position.x = x - w / 2; x -= w; }
    });
  };

  return {
    duration: d,
    draw(ctx, t) {
      const st = M.fall(T)(t - at, { seed: 1, h0: T.fall.height * 1.2, fall: T.fall.time * 1.1, ring: T.fall.ring * 0.6 });
      if (st && t >= c1) {                                     // struck when the value lands: a second, smaller ring
        const u = t - c1, a = T.fall.ring * 0.8 * Math.exp(-6 * u);
        st.rx += a * Math.sin(2 * Math.PI * 6.2 * u); st.ry += 0.6 * a * Math.sin(2 * Math.PI * 8.1 * u + 0.4);
      }
      S.place(piece, st);
      const p = (t - c0) / (c1 - c0);
      show(kit.fmt(countValue(0, Sx.value, p), dec));
      for (const q of labelP) M.drop(T, q, t, q.t0);
      ground.render(ctx, t);
      M.rec(kit, ground, piece, kit.fmt(countValue(0, Sx.value, p), dec));
      for (const q of labelP) M.rec(kit, ground, q);
    },
  };
}
