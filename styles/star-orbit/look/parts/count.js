// A number is a distance between two stars. The stars are born together under the numeral and drift apart along a measuring line
// that grows ticks as they pass; the numeral counts with the distance and lands on the value exactly when the stars reach the ends
// of the line, where they flare once. The numeral comes in from deep space; the label's words orbit in under the line.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, hasArabic, ease, SAFE } from '/engine/kit.js';
import { text3d } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 + Math.round(clock * 3) });
  const { E, S: soft } = await import(look.base + 'motion.js');
  const { flareTex } = await import(look.base + 'ground.js');
  const THREE = W3.THREE, P = W3.P, maxW = SAFE.right - SAFE.left - 40;
  const fmt = (v) => kit.fmt(v, spec.decimals ?? 0), final = fmt(S.value);
  const digits = kit.digits === 'arabic' ? '٠١٢٣٤٥٦٧٨٩' : '0123456789';
  const ltr = { ...brand, dir: 'ltr' }, size0 = T.size.count, dep = T.depth.number;
  const mat = W3.mats(P.light, P.keySide);
  // one solid per character, cloned into slots (a counting number never builds geometry per frame)
  const lib = new Map();
  for (const c of new Set([...digits, ...final])) {
    const tx = await text3d(ltr, c, { size: size0, weight: 900, depth: dep, bevel: 0, curve: 6, material: mat });
    const mesh = tx.words[0]?.group.children[0]; lib.set(c, { mesh, adv: tx.width });
  }
  const cell = Math.max(...[...digits].map((c) => lib.get(c).adv)) * 0.98;
  const cw = (c) => (digits.includes(c) ? cell : lib.get(c).adv);
  const widthOf = (s) => [...s].reduce((a, c) => a + cw(c), 0);
  const zero = new THREE.Box3().setFromObject(lib.get(digits[0]).mesh), dy = -(zero.min.y + zero.max.y) / 2, numH0 = zero.max.y - zero.min.y;
  const num = new THREE.Group(); W3.scene.add(num);
  const slots = [...final].map(() => new Map([...lib].map(([c, o]) => { const m = o.mesh.clone(); m.visible = false; m.position.set(0, dy, 0); num.add(m); return [c, m]; })));
  // affixes: Arabic ones read from the right (prefix on the right), symbols from the left
  const affix = async (text, isPre) => {
    if (!text) return null;
    const r = await W3.row(text, { size: Math.round(size0 * 0.34), weight: 700, depth: T.depth.lead, rings: false });
    return { r, right: hasArabic(text) ? isPre : !isPre, w: (r.x1 - r.x0) };
  };
  const pre = await affix(S.prefix, true), suf = await affix(S.suffix, false), gapA = size0 * 0.1;
  const full = widthOf(final) + (pre ? pre.w + gapA : 0) + (suf ? suf.w + gapA : 0);
  const s = Math.min(1, maxW / full, 300 / numH0); num.scale.setScalar(s);
  const numH = numH0 * s, numY = 600, rulerY = numY + numH / 2 + 95, L = maxW - 40;
  num.position.set(0, W3.wy(numY), -dep * s);
  const affixAt = (a, nx0, nx1) => {
    a.r.root.scale.setScalar(s * a.r.s);
    const ax = a.right ? nx1 + gapA * s + a.w * s / 2 : nx0 - gapA * s - a.w * s / 2;
    a.r.root.position.set(W3.wx(ax) - (a.r.x0 + a.r.x1) / 2 * s, W3.wy(numY + numH * 0.5 - a.r.h * s * 0.55), -a.r.depth * s);
  };
  function layout(str) {
    slots.forEach((m) => m.forEach((g) => { g.visible = false; }));
    const tot = widthOf(str) * s, lw = (pre && !pre.right ? pre.w : 0) + (suf && !suf.right ? suf.w : 0), rw = (pre && pre.right ? pre.w : 0) + (suf && suf.right ? suf.w : 0);
    const shift = (lw - rw) * s / 2 + ((lw ? gapA : 0) - (rw ? gapA : 0)) * s / 2;
    let x = W / 2 - tot / 2 + shift; const nx0 = x;
    [...str].forEach((c, i) => { const g = slots[i].get(c); g.visible = true; g.position.x = (x - W / 2 + cw(c) * s / 2) / s; x += cw(c) * s; });
    const nx1 = x;
    for (const a of [pre, suf]) if (a) affixAt(a, nx0, nx1);
  }
  layout(final);
  // the two stars, the measuring line and its ticks
  const starMat = () => new THREE.SpriteMaterial({ map: flareTex(), color: P.key, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const stars = [new THREE.Sprite(starMat()), new THREE.Sprite(starMat())]; stars.forEach((x) => W3.scene.add(x));
  const cores = [W3.moon(9), W3.moon(9)]; cores.forEach((c) => { c.material = new THREE.MeshBasicMaterial({ color: P.starC, toneMapped: false }); W3.scene.add(c); });
  const lineM = new THREE.MeshBasicMaterial({ color: P.key, toneMapped: false, transparent: true, opacity: 0.9 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lineM); W3.scene.add(bar);
  const NT = 6, ticks = [];
  for (let k = -NT; k <= NT; k++) { if (!k) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), lineM); const major = k % 3 === 0; m.scale.set(2.5, major ? 26 : 14, 2); m.position.set(W3.wx(W / 2 + k * L / 2 / NT), W3.wy(rulerY) + (major ? 0 : 0), 0); W3.scene.add(m); ticks.push({ m, x: Math.abs(k) * L / 2 / NT }); }
  // the label: its words orbit in under the line
  const label = kit.fit(S.label, { size: T.size.label, weight: T.weight.label, maxW, minScale: 0.85, where: 'the count label' });
  const labels = []; let ly = rulerY + 70 + label.size * 0.55;
  for (const r of label.rows) { const row = await W3.row(r.words.map((w) => (w.key ? `*${w.w}*` : w.w)).join(' '), { size: label.size, weight: T.weight.label, depth: T.depth.lead }); W3.place(row, { y: ly }); labels.push(row); ly += label.size * 1.45; }
  const c0 = at + T.count.start, c1 = c0 + T.count.spread;
  return {
    duration: d,
    draw(ctx, t) {
      const p = soft(span(t, c0, c1)), sep = L * p;
      layout(fmt(countValue(0, S.value, p, ease.linear)));
      const pin = E(span(t, at, at + 0.4)); num.visible = t >= at;
      num.position.z = -dep * s - (1 - pin) * 1600;
      for (const a of [pre, suf]) if (a) { a.r.root.visible = t >= at; a.r.root.position.z = -a.r.depth * s - (1 - pin) * 1600; }
      const flare = 1 + 0.6 * Math.sin(Math.PI * span(t, c1, c1 + 0.4)), born = E(span(t, c0 - 0.1, c0 + 0.15));
      stars.forEach((st, i) => {
        const x = W / 2 + (i ? 1 : -1) * sep / 2, k = (70 + 40 * born) * flare * born;
        st.visible = born > 0; st.position.set(W3.wx(x), W3.wy(rulerY), 6); st.scale.set(k, k, 1);
        cores[i].visible = born > 0; cores[i].position.set(W3.wx(x), W3.wy(rulerY), 4); cores[i].scale.setScalar(7 * born);
      });
      bar.visible = sep > 1; bar.scale.set(Math.max(1, sep), 2.5, 2); bar.position.set(W3.wx(W / 2), W3.wy(rulerY), 0);
      ticks.forEach((tk) => { tk.m.visible = tk.x <= sep / 2 + 0.5; });
      labels.forEach((r, i) => W3.fly(r, t, { t0: at + 0.45 + i * 0.08 }));
      W3.render(ctx, t);
      if (num.visible) kit.rec(...W3.box(num), final);
    },
  };
}
