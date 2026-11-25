// The star-orbit ending: the brand's logo is the planet. It comes in from deep space turning towards the camera, an atmosphere
// lights behind it, a ring opens round it with a moon riding on it and a second moon on a wider orbit. The name's words orbit
// the logo-planet and settle under it in one line; the handle (mono) and the slogan rise in beneath.
// spec: { duration }
import { need, span, mix, SAFE } from '/engine/kit.js';
import { logo3d } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const G = await import(look.base + 'ground.js');
  const W3 = await G.create({ W, H, brand, look, clock, kit, seed: 6 });
  const { E, S } = await import(look.base + 'motion.js');
  const THREE = W3.THREE, P = W3.P, dir = W3.dir;
  const ly = 600, LS = 220, PR = 182;
  const logo = logo3d(brand, { size: LS, depth: T.depth.logo, bevel: 2, material: W3.mats(P.key, P.keySide) });
  { const b = new THREE.Box3().setFromObject(logo), k = LS / Math.max(b.max.x - b.min.x, b.max.y - b.min.y); logo.children[0].scale.set(k, k, 1); }
  // the planet the logo stands on: a banded world darkened towards the night, so the logo in the key colour stands out on it
  const world = new THREE.Group(); W3.scene.add(world);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(PR, 72, 40), new THREE.MeshStandardMaterial({ map: G.planetTex(P, 7), color: new THREE.Color(mix(P.sky, P.light, 0.5)), roughness: 0.9 }));
  ball.rotation.set(0.5, 0, 0.35 * dir); world.add(ball);
  logo.position.z = PR + 14 + T.depth.logo / 2; world.add(logo);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: G.glowTex(), color: P.atmo, transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.position.set(0, W3.wy(ly), -PR * 2); W3.scene.add(glow);
  const ringM = new THREE.MeshBasicMaterial({ color: P.key, transparent: true, opacity: 0.9, toneMapped: false });
  const orbit = (rad, tilt, roll, mr, mat) => {
    const outer = new THREE.Group(), frame = new THREE.Group(); outer.add(frame); frame.rotation.x = -tilt; outer.rotation.z = roll;
    frame.add(new THREE.Mesh(new THREE.TorusGeometry(rad, 2.2, 6, 200), mat));
    const mo = W3.moon(mr); frame.add(mo); outer.position.set(0, W3.wy(ly), -PR - T.depth.logo - 20); W3.scene.add(outer); return { outer, mo, rad };
  };
  const o1 = orbit(PR * 1.55, 1.2, 0.32 * dir, 15, ringM);
  const o2 = orbit(PR * 2.25, 1.32, -0.18 * dir, 22, new THREE.MeshBasicMaterial({ color: P.side, transparent: true, opacity: 0.55, toneMapped: false }));
  const maxW = SAFE.right - SAFE.left - 40;
  const nf = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW, single: true, where: 'the brand name' });
  const yName = ly + PR + 150;
  const name = await W3.row(brand.name, { size: nf.size, weight: 800, rings: false });
  W3.place(name, { y: yName });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 500, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const yHandle = yName + nf.size * 0.5 + 70, ySlogan = yHandle + 78;
  const flat = (ctx, t, f, y, t0, color) => {
    const p = E(span(t, t0, t0 + 0.4)); if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, p * 4); ctx.translate(0, (1 - p) * 34);
    kit.drawText(ctx, f, { x0: SAFE.left, x1: SAFE.right, y, align: 'center', color }); ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      const p = E(span(t, 0.05, 1.0));
      world.position.set(0, W3.wy(ly) + (1 - p) * 120, -PR - T.depth.logo - 20 - (1 - p) * 3200);
      world.rotation.set(0, dir * 1.35 * (1 - p) + 0.16 * Math.sin(Math.max(0, t - 1.0) * 0.8), 0);
      ball.rotation.y = t * 0.12;
      glow.scale.setScalar(PR * 3.4 * (0.3 + 0.7 * S(span(t, 0.5, 1.2))));
      for (const [o, t0, w, a0] of [[o1, 0.75, 1.1, 0.5], [o2, 1.0, -0.55, 2.6]]) {
        const q = S(span(t, t0, t0 + 0.4)); o.outer.visible = q > 0.01; o.outer.scale.setScalar(Math.max(0.001, q));
        const a = a0 + (t - t0) * w; o.mo.position.set(o.rad * Math.cos(a), o.rad * Math.sin(a), 0); o.mo.rotation.y = t;
      }
      W3.fly(name, t, { t0: 0.95, window: 0.8, travel: 0.55, centre: { x: W / 2, y: ly }, rx: 400, rz: 380 });
      W3.render(ctx, t);
      flat(ctx, t, handle, yHandle, 1.7, P.lead);
      if (slogan) flat(ctx, t, slogan, ySlogan, 1.95, P.light);
    },
  };
}
