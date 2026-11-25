// Before and after: the old value orbits in and settles in a dim tone, then a comet crosses it from the reading side and leaves a
// straight trail through it, a strike that keeps the old value readable underneath. The new value's words orbit in below it, in
// the key colour, and its ring opens with a moon on it. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 + Math.round(clock * 3) });
  const { E, S: soft } = await import(look.base + 'motion.js');
  const { flareTex, glowTex } = await import(look.base + 'ground.js');
  const THREE = W3.THREE, P = W3.P, maxW = SAFE.right - SAFE.left - 60, rtl = W3.rtl;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [fw, fn] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW, single: true, where: 'the compare label' }) : null;
  const size = fw.size, hL = label ? label.size * 1.9 : 0, top = kit.place(hL + size * 3.3, 720);
  const lab = label ? await W3.row(S.label, { size: label.size, weight: T.weight.lead, depth: T.depth.lead, color: P.lead, rings: false }) : null;
  if (lab) W3.place(lab, { y: top + label.size * 0.6 });
  const yWas = top + hL + size * 0.6, yNow = yWas + size * 1.85;
  const was = await W3.row(asText(S.was), { size, weight: 800, color: P.old, sideColor: P.oldSide, rings: false });
  const now = await W3.row(`*${asText(S.now)}*`.replace(/\s+/g, '* *'), { size, weight: 800 });
  W3.place(was, { y: yWas }); W3.place(now, { y: yNow });
  // the comet and the strike it leaves
  const sx0 = W / 2 + was.root.position.x + was.x0 * was.s - 24, sx1 = W / 2 + was.root.position.x + was.x1 * was.s + 24;
  const from = rtl ? sx1 : sx0, to = rtl ? sx0 : sx1, yc = yWas + size * 0.04;
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: flareTex(), color: P.key, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const tail = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: P.key, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  const strike = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: P.key, toneMapped: false }));
  [head, tail, strike].forEach((m) => { m.visible = false; W3.scene.add(m); });
  const cutT = at + T.compare.cut, nowT = at + T.compare.now;
  return {
    duration: d,
    draw(ctx, t) {
      if (lab) W3.arrive(lab, t, { t0: at, dur: 0.38 });
      W3.fly(was, t, { t0: at + 0.12, window: 0.7 });
      const q = soft(span(t, cutT, cutT + 0.34)), hx = from + (to - from) * q;
      const on = t >= cutT && t < cutT + 0.6;
      head.visible = on; tail.visible = on && q < 1;
      const fade = 1 - span(t, cutT + 0.34, cutT + 0.6);
      head.position.set(W3.wx(hx), W3.wy(yc), 30); head.scale.setScalar(150 * fade + 1);
      const tl = Math.max(1, Math.abs(hx - from) * 0.9);
      tail.position.set(W3.wx((hx + from) / 2 + (hx - from) * 0.1), W3.wy(yc), 28); tail.scale.set(tl, 40, 1);
      strike.visible = t >= cutT; const len = Math.abs(hx - from);
      strike.scale.set(Math.max(1, len), Math.max(4, size * 0.07), 3); strike.position.set(W3.wx((hx + from) / 2), W3.wy(yc), 8);
      W3.fly(now, t, { t0: nowT, window: 0.7 });
      W3.render(ctx, t);
    },
  };
}
