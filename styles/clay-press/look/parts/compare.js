// Before and after: the old value lands in grey clay; then a clay roller rolls across it from the reading side and presses it flat
// into a thin pancake, letter by letter, as it passes. The new value drops in below as a fat accent piece and squashes hard.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const world = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit });
  const { THREE } = await import('/engine/three3d.js');
  const { POSE, FALL, ease } = await import(look.base + 'motion.js');
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = (x1 - x0) / 1.15;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 900, maxW, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0, single: true, where: 'the compare label' }) : null;
  const yLabel = 470, yWas = yLabel + 70 + was.lead / 2, yNow = yWas + was.height + 90;
  const Lb = label ? await world.text(label, { x0, x1, y: yLabel, color: world.soft }) : { rows: [], pieces: [] };
  const Wa = await world.text(was, { x0, x1, y: yWas, color: world.grey, keyColor: world.grey, fatKeys: false });
  const No = await world.text(now, { x0, x1, y: yNow, color: world.accent, keyColor: world.accent });
  No.pieces.forEach((p) => { p.key = true; });

  // the roller: a fat clay cylinder lying across the old word, rolling from the reading side to the other
  const rad = was.size * 0.3, len = was.size * 1.8;
  const roller = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 28, 1), world.clay(world.roller, 1 / 70));
  body.castShadow = body.receiveShadow = true; roller.add(body); world.scene.add(roller); roller.visible = false;
  const glyphs = [];                                                  // each letter of the old value, with its rest pose, flattened alone
  Wa.pieces.forEach((p) => p.obj.traverse((m) => { if (!m.isMesh) return;
    m.geometry.computeBoundingBox(); const c = new THREE.Vector3(); m.geometry.boundingBox.getCenter(c);
    glyphs.push({ m, p, pos: m.position.clone(), c, x: 0 }); }));
  const rollT0 = at + 0.85, rollT1 = rollT0 + 0.6, nowT = rollT1 + POSE, out = d - 6 * POSE;
  const xs = kit.rtl ? [W + 200, -200] : [-200, W + 200], wasY = world.at(W / 2, yWas, 0).y;
  return {
    duration: d,
    draw(ctx, t) {
      world.frame(ctx, t, (tq, k) => {
        Lb.pieces.forEach((p, i) => world.drop(p, tq, k, at + i * POSE, { t1: out }));
        Wa.pieces.forEach((p, i) => world.drop(p, tq, k, at + 0.15 + i * POSE, { t1: out }));
        // the roller crosses in poses; a letter flattens once the roller has passed its middle
        const r = ease(span(tq, rollT0, rollT1)), rxPx = xs[0] + (xs[1] - xs[0]) * r;
        const rx = world.at(rxPx, yWas, 0).x;
        roller.visible = tq >= rollT0 && tq < rollT1 + POSE;
        for (const g of glyphs) {
          const wx = g.p.obj.position.x + g.pos.x + g.c.x;
          const passed = kit.rtl ? rx < wx : rx > wx, f = passed ? Math.min(1, Math.abs(rx - wx) / (rad * 1.2)) : 0;
          const sy = 1 - 0.35 * f, sz = 1 - 0.8 * f, sx = 1 + 0.12 * f;
          g.m.scale.set(sx, sy, sz); g.m.position.set(g.pos.x + g.c.x * (1 - sx), g.pos.y + g.c.y * (1 - sy), g.pos.z);
        }
        roller.position.set(rx, wasY, rad + Wa.pieces[0].depth * 0.25);
        roller.rotation.set(0, (kit.rtl ? -1 : 1) * (rxPx / rad) * 0.9, 0);
        No.pieces.forEach((p, i) => world.drop(p, tq, k, nowT + i * POSE, { t1: out, amp: 1.8 }));
        return [...Lb.rows, ...Wa.rows, ...No.rows].map((x) => [x.pieces.map((p) => p.obj), x.text]);
      });
    },
  };
}
