// The product-turntable ending: the product is lifted off the turntable and out of the shot, the brand's logo is set down on it as
// a solid in the accent, and the turntable brakes, turning the logo round until it stands square to the lens, where it stays.
// Above it, the brand's name, handle (mono) and slogan swing round on their tags and settle. spec: { duration }
import { need, span } from '/engine/kit.js';
import { logo3d } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, X = T.ending, d = spec.duration, fam = brand.fonts.display.family, mono = brand.fonts.mono?.family ?? fam;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 });
  const { E, out, inn } = await import(look.base + 'motion.js');
  await W3.fonts([[800, T.size.name, fam], [600, T.size.handle, mono], [600, T.size.slogan, fam]]);
  const THREE = W3.THREE, tone = W3.tone;
  // the logo, standing upright on the turntable, its face to the front when the table is at rest
  const logo = logo3d(brand, { size: X.logo, depth: 44, bevel: 3, material: new THREE.MeshStandardMaterial({ color: tone.accent, roughness: 0.28, metalness: 0.08 }) });
  const lb = new THREE.Box3().setFromObject(logo), rest = W3.P.tableH - lb.min.y;
  logo.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  W3.table.add(logo);
  W3.tableAngle = (t) => -0.7 * Math.PI * W3.b * (1 - E(span(t, 0, X.brake)));
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: W3.textMax, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 600, maxW: W3.textMax, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: W3.textMax, single: true, where: 'the slogan' }) : null;
  const tags = [W3.textTag(name.rows[0], name, { high: T.high.name }),
    W3.textTag(handle.rows[0], handle, { high: T.high.handle, family: mono, ltr: true, color: tone.ink })];
  if (slogan) tags.push(W3.textTag(slogan.rows[0], slogan, { color: tone.grey, high: T.high.lead }));
  W3.hang(tags, { centre: 560 });
  const when = [X.name, X.handle, X.slogan];
  return {
    duration: d,
    draw(ctx, t) {
      const up = inn(span(t, X.lift, X.lift + 0.5));
      W3.product.visible = up < 1; W3.product.position.y = W3.P.tableH + up * 1900;
      const p = span(t, X.drop - 0.42, X.drop);
      logo.visible = p > 0; logo.position.set(0, rest + (1 - out(p)) * 1100, 0);
      tags.forEach((tg, k) => W3.swing(tg, t, { t0: when[k] }));
      W3.draw(ctx, t);
    },
  };
}
