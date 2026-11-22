// A number in glass: a big accent-glass numeral climbs to its value in a few clean steps, each step a new pane that swings in a little
// with the light; it throws a coloured pool on the floor. The label is etched light under it.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, mix, SAFE, countValue } from '/engine/kit.js';
import { screenBox } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, J = T.dur.joint, first = clock < 0.01;
  const M = await import(look.base + 'motion.js');
  const st = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const P = st.P, maxW = SAFE.right - SAFE.left - 40, dir = kit.rtl ? 1 : -1;
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  const label = kit.fit(S.label, { size: T.size.label, weight: 600, maxW, where: 'the count label' });
  const K = 8, steps = [];                                  // the values it passes through, each its own pane, built once
  for (let k = 0; k <= K; k++) { const s = text(countValue(0, S.value, k / K)); if (!steps.length || steps.at(-1).s !== s) steps.push({ s, k }); }
  const size = T.size.count, mats = { key: M.glass(P, st.env, 'key', size * 0.3), clear: M.glass(P, st.env, 'clear', size * 0.3) };
  const yNum = 600, [x, y] = st.at(W / 2, yNum);
  let widest = 0;
  for (const s of steps) { s.g = await M.glassText(brand, s.s, { size, weight: 800, mats: () => mats.key }); widest = Math.max(widest, s.g.width); }
  const k = widest > maxW ? maxW / widest : 1;
  for (const s of steps) { s.g.root.scale.setScalar(k); s.g.root.position.set(x, y, 0); s.g.root.visible = false; st.scene.add(s.g.root); }
  const pool = st.patch(P.glow, W / 2, Math.max(widest * k * 1.3, 420), { text: steps.at(-1).s });
  const yLabel = yNum + size * k * 0.62 + 40 + label.lead / 2, labC = mix(P.ground, P.ink, 0.8);
  const t0 = at + 0.1, t1 = at + 1.5, out0 = d - J * 0.9;
  return {
    duration: d,
    draw(ctx, t) {
      const sw = M.sweep(t, d, J, W, first);
      st.camera.position.z = T.cam.D * (1 - 0.02 * Math.min(1, t / d));
      const p = span(t, t0, t1), kk = Math.min(K, Math.floor(p * K + 1e-6));
      let cur = steps[0]; for (const s of steps) if (s.k <= kk) cur = s;
      const kStart = t0 + (cur.k / K) * (t1 - t0);
      for (const s of steps) s.g.root.visible = false;
      const r = cur.g.root;
      M.turnIn(r, cur === steps[0] ? span(t, t0 - 0.3, t0 + 0.3) : 1, dir);
      if (cur !== steps[0]) r.rotation.y = dir * 0.22 * (1 - M.land(span(t, kStart, kStart + 0.22)));   // each step swings in a little
      if (p >= 1) r.rotation.y += Math.sin((t - t1) * 1.2) * 0.04;
      M.turnOut(r, span(t, out0, out0 + T.dur.out), dir);
      pool.material.opacity = 0.95 * M.soft(span(t, t1 - 0.2, t1 + 0.5)) * (1 - span(t, out0, out0 + 0.4));
      st.draw(ctx, t, sw);
      if (r.visible) kit.rec(...screenBox(r, st.camera, W, H), cur.s);
      const a = M.land(span(t, at + 0.4, at + 0.8)) * (1 - M.away(span(t, out0, out0 + 0.35)));
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel + (1 - a) * 14, align: 'center', color: labC }); ctx.restore(); }
    },
  };
}
