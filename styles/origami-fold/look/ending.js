// The origami-fold ending: a greeting card. It stands up off the table closed, its cover in the accent's paper with the logo
// blind-embossed in it; the cover swings open on its spine (the reading-start side) towards you and out of the frame, and inside,
// as the card opens, the brand's logo pops up off the page as a solid paper cut-out and settles. Printed inside: the name, a short
// rule, the handle (mono) and the slogan. spec: { duration }
import { need, span, SAFE, mix } from '/engine/kit.js';
import { logo3d } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, X = T.ending, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 9 });
  const { E, EI, stand, DEG } = await import(look.base + 'motion.js');
  const THREE = W3.THREE, P = W3.P, rtl = W3.rtl, s = W3.s;
  const cw = X.w, inner = cw - 2 * X.pad;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const name = kit.fit(brand.name, { size: T.size.name, weight: 800, maxW: inner, single: true, where: 'the brand name' });
  const handle = kit.fit(brand.handle, { family: mono, size: T.size.handle, weight: 600, maxW: inner, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: inner, single: true, where: 'the slogan' }) : null;
  const L = X.logo, gap = 54;
  const yLogo = X.pad, yName = yLogo + L + gap + name.size * 0.6, yRule = yName + name.size * 0.72 + 18;
  const yHandle = yRule + 26 + handle.size * 0.65, ySlogan = yHandle + handle.size * 0.7 + 22 + (slogan ? slogan.size * 0.6 : 0);
  const ch = (slogan ? ySlogan + slogan.size * 0.6 : yHandle + handle.size * 0.5) + X.pad * 0.9;
  const top = kit.place(ch, T.layout.centre), left = 540 - cw / 2;

  // inside page
  const ip = W3.paper(cw, ch, P.paper);
  { const g = ip.g;
    g.strokeStyle = mix(P.paper, P.ink, 0.22); g.lineWidth = 1.5; g.strokeRect(26, 26, cw - 52, ch - 52);
    kit.drawText(g, name, { x0: 0, x1: cw, y: yName, align: 'center', color: P.ink, key: P.ink });
    g.fillStyle = P.key; g.fillRect(cw / 2 - 60, yRule - 3, 120, 6);
    kit.drawText(g, handle, { x0: 0, x1: cw, y: yHandle, align: 'center', color: P.leadInk, key: P.leadInk });
    if (slogan) kit.drawText(g, slogan, { x0: 0, x1: cw, y: ySlogan, align: 'center', color: P.ink, key: P.ink });
    // where the pop-up is glued: a faint slit under the logo
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(cw / 2 - L * 0.42, yLogo + L + 6, L * 0.84, 2); }
  // cover: the accent's paper, the logo pressed into it (a shade line and a lit line offset from each other)
  const cp = W3.paper(cw, ch, P.key);
  { const g = cp.g, ls = Math.min(cw, ch) * 0.42, lx = (cw - ls) / 2, ly = (ch - ls) / 2;
    brand.logo.draw(g, lx - 2, ly - 2, ls, 'rgba(0,0,0,0.16)'); brand.logo.draw(g, lx + 2, ly + 2, ls, 'rgba(255,255,255,0.16)'); brand.logo.draw(g, lx, ly, ls, mix(P.key, P.keyInk, 0.12));
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; g.strokeRect(30, 30, cw - 60, ch - 60); }

  const root = new THREE.Group(); root.position.set(W3.wx(540), W3.wy(top + ch), W3.Zs); W3.scene.add(root);
  const page = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), new THREE.MeshLambertMaterial({ map: W3.tex(ip.cv) }));
  page.position.set(0, ch / 2, 0); page.castShadow = true; page.receiveShadow = true; page.material.shadowSide = THREE.DoubleSide; root.add(page);
  const hinge = new THREE.Group(); hinge.position.set(-s * cw / 2, ch / 2, 3); root.add(hinge);     // the spine, on the reading-start side
  const cg = new THREE.PlaneGeometry(cw, ch); cg.translate(s * cw / 2, 0, 0);
  const cover = new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ map: W3.tex(cp.cv), side: THREE.FrontSide }));
  cover.material.shadowSide = THREE.DoubleSide; cover.castShadow = true;
  cover.add(new THREE.Mesh(cg, new THREE.MeshLambertMaterial({ color: P.back, side: THREE.BackSide })));
  hinge.add(cover);
  // the pop-up logo: a paper-thin solid cut-out of the logo in the accent, standing on the page
  const pop = new THREE.Group(); pop.position.set(0, ch - yLogo - L, 1); root.add(pop);
  const lm = new THREE.MeshLambertMaterial({ color: P.key });
  let logo;
  if (brand.logo.path) logo = logo3d(brand, { size: L, depth: X.depth, bevel: 1.2, material: lm });
  else { const c = document.createElement('canvas'); c.width = c.height = 512; brand.logo.draw(c.getContext('2d'), 0, 0, 512, P.key);
    logo = new THREE.Mesh(new THREE.PlaneGeometry(L, L), new THREE.MeshLambertMaterial({ map: W3.tex(c), transparent: true, alphaTest: 0.5 })); }
  logo.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  { const b = new THREE.Box3().setFromObject(logo), k = L / Math.max(b.max.x - b.min.x, b.max.y - b.min.y); logo.scale.set(k, k, 1); }
  const inner3 = new THREE.Group(); inner3.add(logo); logo.position.set(0, L / 2, X.depth / 2); pop.add(inner3);

  const rect = (yc, f) => [540 - f.width / 2, 540 + f.width / 2, top + yc - f.size * 0.62, top + yc + f.size * 0.62];
  const rName = rect(yName, name), rHandle = rect(yHandle, handle), rSlogan = slogan ? rect(ySlogan, slogan) : null;
  return {
    duration: d,
    draw(ctx, t) {
      const p = span(t, 0, X.up);
      root.rotation.x = stand(p, T.fold.stand); root.position.z = W3.Zs + T.z.lift * (1 - E(p));
      const o = EI(span(t, X.open, X.open + X.openLen));
      hinge.rotation.y = -s * Math.PI * o * 0.995;
      const q = span(t, X.open + X.openLen * 0.45, X.open + X.openLen * 0.45 + X.popLen);
      const lift = q <= 0 ? 0 : q >= 1 ? 1 : 1 - Math.exp(-6 * q) * Math.cos(7 * q) * (1 - q);
      inner3.scale.set(1, 1, Math.max(0.02, lift)); inner3.position.z = 10 * lift;
      inner3.rotation.x = (1 - Math.min(1, lift)) * 32 * DEG;
      logo.visible = o > 0.3;
      W3.draw(ctx, t);
      if (o > 0.6) { kit.rec(...rName, brand.name); kit.rec(...rHandle, brand.handle); if (rSlogan) kit.rec(...rSlogan, brand.slogan.join(' ')); }
    },
  };
}
