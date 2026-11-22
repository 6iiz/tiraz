// The glass ending: the brand's logo as a thick block of glass turns into the light; then a light inside it comes on, glowing through
// the frosted faces and throwing a coloured pool on the floor. The name follows in glass under it; the handle and the slogan are etched
// light. spec: { duration }
import { need, span, mix, SAFE } from '/engine/kit.js';
import { screenBox } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, J = T.dur.joint, first = clock < 0.01;
  const M = await import(look.base + 'motion.js'), { THREE } = M;
  const st = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const P = st.P, maxW = SAFE.right - SAFE.left - 40, dir = kit.rtl ? 1 : -1, ls = T.size.logo;
  const [face, side] = M.glass(P, st.env, 'clear', ls * 0.3);
  // the logo's own glass: a lighter frost, so the light inside reads through it
  const lgFace = face.clone(); lgFace.roughness = 0.28; lgFace.emissiveIntensity = 0.08;
  const yLogo = 520, [xl, yl] = st.at(W / 2, yLogo);
  const logo = M.logoGlass(brand, { size: ls, depth: ls * 0.3, material: [lgFace, side] });
  logo.position.set(xl, yl, 0); st.scene.add(logo);
  // the light inside: the same outline, thinner and a little smaller, glowing in the accent
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(P.glow), toneMapped: true });
  const core = M.logoGlass(brand, { size: ls * 0.7, depth: ls * 0.05, material: coreMat });
  logo.add(core);
  const inner = new THREE.PointLight(new THREE.Color(P.glow), 0, 1100, 0); inner.position.set(0, 0, ls * 0.3); logo.add(inner);
  const pool = st.patch(P.glow, W / 2, ls * 1.5, { z: 380, length: 560 });
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const mats = { clear: [face, side], key: [face, side] };
  const ng = await M.glassText(brand, name.rows[0].words.map((w) => w.w).join(' '), { size: name.size, mats: (k) => mats[k] });
  const yName = yLogo + ls / 2 + 70 + name.lead / 2, [xn, yn] = st.at(W / 2, yName);
  ng.root.position.set(xn, yn, 0); st.scene.add(ng.root);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 500, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.lead, weight: 500, maxW, single: true, where: 'the slogan' }) : null;
  const yHandle = yName + name.lead / 2 + 30 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 16 + (slogan ? slogan.lead / 2 : 0);
  const soft = mix(P.ground, P.ink, 0.8), grey = mix(P.ground, P.ink, 0.62);
  const on = 1.05;                                                   // the moment the light inside comes on
  return {
    duration: d,
    draw(ctx, t) {
      const sw = M.sweep(t, d, J, W, first);
      st.camera.position.z = T.cam.D * (1 - 0.025 * Math.min(1, t / d));
      M.turnIn(logo, span(t, 0.1, 1.0), dir);
      if (t > 1.0) logo.rotation.y = Math.sin((t - 1.0) * 0.9) * 0.16;        // it turns slowly, so the glass shows its thickness
      const L = M.settle(span(t, on, on + 0.6)), pulse = 1 + 0.06 * Math.sin((t - on) * 2.4) * L;
      coreMat.color.set(P.glow).multiplyScalar(0.2 + 2.6 * L * pulse);
      inner.intensity = 1.6 * L; lgFace.emissiveIntensity = 0.08 + 0.12 * L;
      pool.material.opacity = 0.6 * L;
      ng.words.forEach((w, i) => M.turnIn(w.group, span(t, 1.35 + i * 0.1, 1.35 + i * 0.1 + T.dur.in), dir));
      st.draw(ctx, t, sw);
      if (ng.words.some((w) => w.group.visible)) kit.rec(...screenBox(ng.root, st.camera, W, H), brand.name);
      const show = (f, y, t0, color) => { const a = M.land(span(t, t0, t0 + 0.4)); if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a; kit.drawText(ctx, f, { x0: SAFE.left, x1: SAFE.right, y: y + (1 - a) * 14, align: 'center', color }); ctx.restore(); };
      show(handle, yHandle, 1.75, soft);
      if (slogan) show(slogan, ySlogan, 2.05, grey);
    },
  };
}
