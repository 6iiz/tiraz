// The metal-cast ending: the brand's logo, cast deep in the accent metal, is let go from high above the table and stamps down with
// the heaviest landing of the reel. The name drops in under it in the light metal, then the handle (mono face) and the slogan, a
// step back in tone. The soft light passes across the logo and the camera keeps leaning in. spec: { duration }
import { need, SAFE } from '/engine/kit.js';
import { THREE } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration;
  const ground = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const S = await import(look.base + 'studio.js'), M = await import(look.base + 'motion.js');
  const x0 = SAFE.left + T.margin, x1 = SAFE.right - T.margin, maxW = x1 - x0, pal = ground.pal;

  const ls = 300, yLogo = 560;
  const logoM = S.metal(pal.accent, pal.dark, { rough: 0.22, metalness: 0.72 });
  const logo = new THREE.Mesh(S.cast(S.logoShapes(brand, ls), { depth: 54, bevel: 5 }), logoM);
  logo.castShadow = true; logo.receiveShadow = true;
  const lg = new THREE.Group(); lg.add(logo); lg.visible = false; ground.scene.add(lg);
  const logoP = { group: lg, mats: logoM, base: ground.at(W / 2, yLogo), up: ground.up(ground.at(W / 2, yLogo)), half: { x: ls / 2, y: ls / 2 }, seed: 0 };

  const name = kit.fit(brand.name, { size: T.size.name, weight: T.weight.name, maxW, single: true, where: 'the brand name' });
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW, single: true, where: 'the slogan' }) : null;
  const yName = yLogo + ls / 2 + 70 + name.lead / 2, yHandle = yName + name.lead / 2 + 18 + handle.lead / 2;
  const ySlogan = yHandle + handle.lead / 2 + 14 + (slogan ? slogan.lead / 2 : 0);
  const nameP = S.castText(ground, name, { x0, x1, y: yName, rtl: kit.rtl, color: () => pal.light });
  const handleP = S.castText(ground, handle, { x0, x1, y: yHandle, rtl: kit.rtl, color: () => pal.soft, depth: 7, bevel: 1 });
  const sloganP = slogan ? S.castText(ground, slogan, { x0, x1, y: ySlogan, rtl: kit.rtl, color: () => pal.soft }) : [];
  nameP.forEach((p, i) => { p.t0 = 0.95 + i * 0.07; });
  handleP.forEach((p, i) => { p.t0 = 1.35 + i * 0.05; });
  sloganP.forEach((p, i) => { p.t0 = 1.6 + i * 0.06; });
  const words = [...nameP, ...handleP, ...sloganP];
  ground.passes(1.9, T.light.every, yLogo + 120);

  return {
    duration: d,
    draw(ctx, t) {
      S.place(logoP, M.fall(T)(t - 0.25, { seed: 0, h0: T.fall.height * 1.7, fall: 0.34, e: 0.12, ring: T.fall.ring * 1.6 }));
      for (const p of words) M.drop(T, p, t, p.t0);
      ground.render(ctx, t);
      for (const p of words) M.rec(kit, ground, p);
    },
  };
}
