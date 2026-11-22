// A number: a skyscraper. The numerals, stretched into a tall tower in the key colour, climb out of the street one storey at a time,
// and the number counts up with the storeys (each storey adds its share), landing exactly on the value at the roof. Then its windows
// switch on and a beacon blinks on top. The label hangs flat in the sky above.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, SAFE, rgba, hasArabic, countValue, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const GM = await import(look.base + 'ground.js'), G = GM.create({ W, H, brand, look, clock });
  const { THREE } = await import('/engine/three3d.js');
  const { floors, glide, E } = await import(look.base + 'motion.js');
  const seed = 5 + Math.round(clock * 10), w = await G.world({ seed }), SL = w.SL, M = w.M;
  const fmt = (v) => kit.fmt(v, spec.decimals ?? 0), final = fmt(S.value), N = T.count.floors, stretch = T.count.stretch;
  const digits = kit.digits === 'arabic' ? '٠١٢٣٤٥٦٧٨٩' : '0123456789';
  const chars = [...new Set((digits + final).split(''))];
  const keyMats = () => [M.keyFace, M.keySide];
  const lib = await w.row(chars.join(' '), { mats: keyMats, keyScale: 1, depth: SL * 0.7 });
  const glyph = new Map(lib.words.map((x) => [x.text, x]));
  const cell = Math.max(...[...digits].map((c) => (glyph.get(c) ? glyph.get(c).x1 - glyph.get(c).x0 : 0))) + SL * 0.05;
  const cw = (c) => (digits.includes(c) ? cell : (glyph.get(c).x1 - glyph.get(c).x0) + SL * 0.06);
  const inner = new THREE.Group(), num = new THREE.Group(); inner.add(num); num.scale.set(1, stretch, 1);
  const slots = [...final].map(() => new Map(chars.map((c) => { const g = glyph.get(c).group.clone(); g.position.set(0, 0, 0); g.scale.setScalar(1); g.visible = false; num.add(g); return [c, g]; })));
  const off = (c) => { const x = glyph.get(c); return (x.x0 + x.x1) / 2 - x.gx; };
  // affixes stand beside the tower at half height: Arabic ones read from the right (prefix on the right), symbols from the left
  const affix = async (text, isPre) => {
    if (!text) return null; const r = await w.row(text, { mats: keyMats, keyScale: 1, depth: SL * 0.5 }); r.inner.scale.setScalar(0.55); inner.add(r.inner);
    const right = hasArabic(text) ? isPre : !isPre; return { r, right, wd: r.width * 0.55 };
  };
  const pre = await affix(S.prefix, true), suf = await affix(S.suffix, false);
  const baseline = lib.baseline, lo = Math.min(...lib.words.filter((x) => digits.includes(x.text)).map((x) => x.lo)), hi = Math.max(...lib.words.filter((x) => digits.includes(x.text)).map((x) => x.hi));
  const widthOf = (str) => [...str].reduce((s, c) => s + cw(c), 0);
  const fullW = widthOf(final) + (pre ? pre.wd + SL * 0.15 : 0) + (suf ? suf.wd + SL * 0.15 : 0);
  const holder = new THREE.Group(); holder.add(inner);
  const item = { root: holder, inner, minY: lo * stretch, maxY: hi * stretch, baseline: baseline * stretch, width: fullW, depth: SL * 0.7, text: final };

  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW: SAFE.right - SAFE.left, where: 'the count label' });
  const maxW = SAFE.right - SAFE.left - 80, hgt = item.maxY - item.minY;
  let size = Math.min(T.size.count, maxW * SL / fullW), hpx = hgt * size / SL;
  if (hpx > T.count.maxH) { size *= T.count.maxH / hpx; hpx = T.count.maxH; }
  const top = kit.place(label.height + 60 + hpx, T.layout.centre);
  const spec0 = { item, size, y: top + label.height + 60 + hpx };
  const { hc } = w.layout([spec0], { horizon: spec0.y - hpx * T.layout.horizon });
  w.scene.add(holder); w.aim([item]);
  const back = T.lens.near * T.cam.back, side = seed % 2 ? 1 : -1, target = { x: 0, z: item.zFront - item.depth * item.s * 0.5 };
  const G0 = { at, d, rest: { x: 0, y: hc, z: 0 }, side, back, len: T.cam.glide, outLen: T.cam.out, creep: T.cam.creep, target };
  const poseAt = (t) => { const g = glide(t, G0); return [g.x, g.y, g.z, Math.atan2(-(g.aimX - g.x), -(g.aimZ - g.z))]; };
  // the full number stands while the city is laid out, so no block is built in front of it
  layoutNumber(final);
  w.city({ items: [item], poses: [poseAt(at + 50), poseAt(at), poseAt(at + T.cam.glide * 0.4), poseAt(d - 0.25)] });
  const beacon = w.beacon(); w.scene.add(beacon.s);
  const r0 = at + T.count.start, r1 = r0 + T.count.climb, tLit = r1 + 0.1, yLabel = top + label.lead / 2;

  function layoutNumber(str) {
    slots.forEach((m) => m.forEach((g) => { g.visible = false; }));
    const total = widthOf(str); let x = -fullW / 2 + (pre && !pre.right ? pre.wd + SL * 0.15 : 0) + (widthOf(final) - total) / 2;
    [...str].forEach((c, i) => { const g = slots[i].get(c); g.visible = true; g.position.x = x + cw(c) / 2 - off(c); x += cw(c); });
    const nx0 = -fullW / 2 + (pre && !pre.right ? pre.wd + SL * 0.15 : 0), nx1 = nx0 + widthOf(final);
    for (const a of [pre, suf]) if (a) a.r.inner.position.set(a.right ? nx1 + SL * 0.15 + a.wd / 2 : nx0 - SL * 0.15 - a.wd / 2, baseline * stretch - baseline * 0.55, 0);
  }

  return {
    duration: d,
    draw(ctx, t) {
      const g = glide(t, G0); w.lookAt(g.x, g.y, g.z, g.aimX, g.aimZ);
      const raw = span(t, r0, r1), p = floors(raw, N), done = raw >= 1 ? N : Math.floor(raw * N + 0.3);
      layoutNumber(fmt(countValue(0, S.value, done / N, ease.linear)));
      inner.position.y = -(1 - p) * (hgt + 10);
      const on = E(span(t, tLit, tLit + 0.14)); M.keySide.emissiveIntensity = M.keySideLit * on;
      beacon.at(num, on * (0.55 + 0.45 * Math.cos((t - tLit) * Math.PI * 1.6)));
      w.render(ctx, t + clock);
      const b = w.screenOf(inner); if (b && b[3] - b[2] > 4) kit.rec(...b, final);
      const pin = E(span(t, at + 0.1, at + 0.45)), pout = span(t, d - 0.35, d);
      if (pin > 0 && pout < 1) {
        ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3) * (1 - pout); ctx.translate(0, (1 - pin) * 26 - E(pout) * 40);
        GM.haze(ctx, w.P, 540 - label.width / 2 - 50, 540 + label.width / 2 + 50, yLabel + (label.rows.length - 1) * label.lead / 2, label.height + 10, 1);
        ctx.shadowColor = rgba(w.P.night, 0.8); ctx.shadowBlur = 18;
        kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: w.P.light });
        ctx.restore();
      }
    },
  };
}
