// Before and after in glass: the old value stands in smoked glass; a rod of light slides across it and its light goes out as it sinks
// back; then the new value turns into the light in accent glass, throwing its coloured pool on the floor.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, mix, SAFE } from '/engine/kit.js';
import { screenBox } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, J = T.dur.joint, first = clock < 0.01;
  const M = await import(look.base + 'motion.js'), { THREE } = M;
  const st = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const P = st.P, maxW = SAFE.right - SAFE.left - 40, dir = kit.rtl ? 1 : -1;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [fw, fn] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 500, maxW, single: true, where: 'the compare label' }) : null;
  const size = fw.size, depth = size * 0.32;
  const smoke = M.glass(P, st.env, 'smoke', depth), key = M.glass(P, st.env, 'key', depth);
  const plain = (f) => f.rows[0].words.map((w) => w.w).join(' ');
  const was = await M.glassText(brand, plain(fw), { size, mats: () => smoke });
  const now = await M.glassText(brand, plain(fn), { size, mats: () => key });
  const yLabel = 430, yWas = 640, yNow = 900;
  const [xw, yw] = st.at(W / 2, yWas), [xn, yn] = st.at(W / 2, yNow);
  was.root.position.set(xw, yw, 0); now.root.position.set(xn, yn, 0); st.scene.add(was.root, now.root);
  const rodMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.ink).multiplyScalar(2.2) });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 1, 12), rodMat); rod.rotation.z = Math.PI / 2; rod.visible = false; st.scene.add(rod);
  const pool = st.patch(P.glow, W / 2, Math.max(now.width * 1.4, 380), { text: plain(fn), z: 460 });
  const base = smoke.map((m) => m.emissiveIntensity);
  const cutT = at + 0.85, nowT = at + 1.35, out0 = d - J * 0.9, labC = mix(P.ground, P.ink, 0.78);
  return {
    duration: d,
    draw(ctx, t) {
      const sw = M.sweep(t, d, J, W, first);
      st.camera.position.z = T.cam.D * (1 - 0.02 * Math.min(1, t / d));
      was.words.forEach((w, i) => { M.turnIn(w.group, span(t, at + 0.15 + i * 0.08, at + 0.15 + i * 0.08 + T.dur.in), dir); M.turnOut(w.group, span(t, out0, out0 + T.dur.out), dir); });
      // the cut: a rod of light crosses the old value from the reading side, then the old value dims and sinks back a little
      const pc = M.soft(span(t, cutT, cutT + 0.35)), len = was.width + 90, sink = M.land(span(t, cutT + 0.3, cutT + 0.9));
      rod.visible = pc > 0 && t < out0 + 0.3; rod.scale.y = Math.max(1, len * pc);
      rod.position.set(xw + (kit.rtl ? 1 : -1) * len * (1 - pc) / 2, yw + size * 0.05, depth * 0.6 + 6 - sink * 120);
      rodMat.color.set(P.ink).multiplyScalar(2.2 - 1.2 * sink);
      was.root.position.z = -sink * 90; was.root.rotation.x = -sink * 0.12;
      smoke.forEach((m, i) => { m.emissiveIntensity = base[i] * (1 - 0.2 * sink); });
      now.words.forEach((w, i) => { M.turnIn(w.group, span(t, nowT + i * 0.08, nowT + i * 0.08 + T.dur.in + 0.1), dir); M.turnOut(w.group, span(t, out0 + 0.05, out0 + 0.05 + T.dur.out), dir); });
      pool.material.opacity = 0.95 * M.soft(span(t, nowT + 0.3, nowT + 0.9)) * (1 - span(t, out0, out0 + 0.4));
      st.draw(ctx, t, sw);
      if (was.words.some((w) => w.group.visible)) kit.rec(...screenBox(was.root, st.camera, W, H), plain(fw));
      if (now.words.some((w) => w.group.visible)) kit.rec(...screenBox(now.root, st.camera, W, H), plain(fn));
      if (label) {
        const a = M.land(span(t, at - 0.1, at + 0.3)) * (1 - M.away(span(t, out0, out0 + 0.35)));
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel + (1 - a) * 14, align: 'center', color: labC }); ctx.restore(); }
      }
    },
  };
}
