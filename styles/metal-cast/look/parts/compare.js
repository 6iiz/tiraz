// Before and after, in metal: the old value lands in a dulled metal; a polished rod drops across it like a strike; the old piece tips
// over its top edge and falls face down (dimming as it goes) and the rod drops to the table where it stood. Then the new value lands
// below, larger, in the accent metal, from higher, and rings. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, mix, SAFE } from '/engine/kit.js';
import { THREE } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, Sx = spec.says;
  const ground = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const S = await import(look.base + 'studio.js'), M = await import(look.base + 'motion.js');
  const x0 = SAFE.left + T.margin, x1 = SAFE.right - T.margin, maxW = x1 - x0, pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (Sx.unit ? ' ' + Sx.unit : '');
  const [was, now] = kit.fitAll([asText(Sx.was), asText(Sx.now)], { size: T.size.compare, weight: 800, maxW, where: 'a compared value' });
  const label = Sx.label ? kit.fit(Sx.label, { size: T.size.label, weight: T.weight.label, maxW, single: true, where: 'the compare label' }) : null;
  const yLabel = 410, yWas = 700, yNow = Math.max(940, yWas + was.height + 120);

  const labelP = label ? S.castText(ground, label, { x0, x1, y: yLabel, rtl: kit.rtl, color: (w) => (w.key ? pal.accent : pal.soft) }) : [];
  labelP.forEach((p, i) => { p.t0 = at + i * 0.05; });
  const wasP = S.castText(ground, was, { x0, x1, y: yWas, rtl: kit.rtl, color: () => pal.old });
  wasP.forEach((p, i) => { p.t0 = at + 0.15 + i * 0.06; });
  const nowP = S.castText(ground, now, { x0, x1, y: yNow, rtl: kit.rtl, color: () => pal.accent });
  nowP.forEach((p, i) => { p.t0 = at + 1.5 + i * 0.07; });

  // the hinge: the top edge of the old value's face; its pieces hang from a pivot there so they tip over together
  const wasDepth = was.size * 0.26, wasFace = wasDepth + 2 * Math.max(0.8, was.size * 0.02);
  const hinge = ground.at(W / 2, yWas - was.size * 0.5); hinge.z = wasFace;
  const pivot = new THREE.Group(); pivot.position.copy(hinge); ground.scene.add(pivot);
  for (const p of wasP) { pivot.add(p.group); p.rel = p.base.clone().sub(hinge); }

  // the rod
  const rodLen = was.width + 110, rodR = Math.max(7, was.size * 0.06);
  const rodM = S.metal(pal.light, pal.dark, { rough: 0.2, metalness: 0.85 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, rodLen, 28, 1), rodM[0]);
  rod.rotation.z = Math.PI / 2 + (kit.rtl ? -0.12 : 0.12); rod.castShadow = true;
  const rodG = new THREE.Group(); rodG.add(rod); rodG.visible = false; ground.scene.add(rodG);
  const rodBase = ground.at(W / 2, yWas);
  const rodP = { group: rodG, mats: [rodM[0]], base: rodBase, half: { x: 0, y: 0 }, seed: 3 };
  const rodT = at + 0.8, tip0 = at + 1.06, tip1 = at + 1.48;
  ground.passes(at + 2.0, T.light.every, (yWas + yNow) / 2);

  return {
    duration: d,
    draw(ctx, t) {
      for (const p of labelP) M.drop(T, p, t, p.t0);
      // the old value, then its tipping over
      const u = (t - tip0) / (tip1 - tip0);
      let th = 0;
      if (u >= 1) { const v = t - tip1; th = -Math.PI + 0.07 * Math.exp(-7 * v) * Math.abs(Math.sin(2 * Math.PI * 2.6 * v)); }
      else if (u > 0) th = -Math.PI * M.tipping(u);
      pivot.rotation.x = th;
      for (const p of wasP) {
        const st = M.fall(T)(t - p.t0, { seed: p.seed });
        S.place(p, st, p.rel);
        S.tone(p.mats, mix(pal.old, pal.dark, 0.78 * Math.min(1, Math.max(0, u))), pal.dark);
      }
      // the rod: dropped onto the old value, then down to the table once the value has tipped away
      const st = M.fall(T)(t - rodT, { seed: 3, h0: T.fall.height * 1.2, fall: 0.22, ring: 0 });
      if (st) {
        const onWas = wasFace + rodR, below = (t - tip0 - 0.12) / 0.16;
        const zRest = below <= 0 ? onWas : below >= 1 ? rodR : rodR + (onWas - rodR) * (1 - below * below);
        S.place(rodP, st, rodBase.clone().setZ(zRest));
      } else rodG.visible = false;
      for (const p of nowP) M.drop(T, p, t, p.t0, { h0: T.fall.height * 1.35, ring: T.fall.ring * 1.4 });
      ground.render(ctx, t);
      for (const p of labelP) M.rec(kit, ground, p);
      if (u < 0.5) for (const p of wasP) M.rec(kit, ground, p);       // face down, the old value is no longer text to read
      for (const p of nowP) M.rec(kit, ground, p);
    },
  };
}
