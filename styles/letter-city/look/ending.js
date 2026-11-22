// The letter-city ending: the street opens onto a round plaza. The brand's logo rises in the middle of it as the city's landmark,
// storey by storey, on a lit plinth; its windows switch on and a beacon blinks on top. The brand's name rises as a low building in
// front of it; the handle and the slogan arrive flat under it. The camera ends its glide slowly circling the landmark. spec: { duration }
import { need, span, SAFE, rgba, ease } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, d = spec.duration, X = T.ending;
  const GM = await import(look.base + 'ground.js'), G = GM.create({ W, H, brand, look, clock });
  const { THREE } = await import('/engine/three3d.js');
  const { floors, glide, E } = await import(look.base + 'motion.js');
  const seed = 17 + Math.round(clock * 10), w = await G.world({ seed }), SL = w.SL, M = w.M, P = w.P;

  // the landmark: the logo standing on a plinth of lit storeys
  const L = await w.logo(SL * 3), lb = new THREE.Box3().setFromObject(L), lw = lb.max.x - lb.min.x, lh = lb.max.y - lb.min.y, ld = lb.max.z - lb.min.z;
  const ped = lh * 0.22, inner = new THREE.Group(); L.position.set(-(lb.min.x + lb.max.x) / 2, ped - lb.min.y, ld / 2 - (lb.min.z + lb.max.z) / 2 + ld * 0.0);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(lw * 1.12, ped, ld * 1.6), new THREE.MeshStandardMaterial({ color: mix3(P), roughness: 0.8, emissive: P.key, emissiveIntensity: 0.12, fog: false }));
  plinth.position.set(0, ped / 2, ld / 2); inner.add(L, plinth);
  const holder = new THREE.Group(); holder.add(inner);
  const logo = { root: holder, inner, minY: 0, maxY: ped + lh, baseline: 0, width: lw * 1.12, depth: ld * 1.3, text: '' };
  const name = await w.row(brand.name, { mats: () => [M.face, M.side] });

  const maxW = SAFE.right - SAFE.left - 60;
  let nSize = Math.min(T.size.name, maxW * SL / name.width);
  const hName = (name.maxY - name.minY) * nSize / SL;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const handle = kit.fit(brand.handle, { family: mono, weight: 600, size: T.size.handle, maxW: SAFE.right - SAFE.left, single: true, where: 'the handle' });
  const slogan = brand.slogan?.length ? kit.fit(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the slogan' }) : null;
  const tail = 40 + handle.lead + (slogan ? slogan.lead + 6 : 0);
  const hLogo = X.logoH, gap = 60;
  const top = kit.place(hLogo + gap + hName + tail, T.layout.centre);
  const sLogo = hLogo * SL / (logo.maxY - logo.minY);
  const specs = [{ item: logo, size: sLogo, y: top + hLogo }, { item: name, size: nSize, y: top + hLogo + gap + hName }];
  const { hc } = w.layout(specs, { horizon: specs[0].y - hLogo * 0.35 });
  w.scene.add(holder, name.root); w.podium(name); w.aim([logo, name]);
  const plazaR = Math.max(logo.halfW * 1.9, 700), plazaZ = logo.zFront - logo.depth * logo.s * 0.5;
  const back = T.lens.near * T.cam.back * 1.2, side = seed % 2 ? 1 : -1, target = { x: 0, z: plazaZ };
  const G0 = { at: 0, d: d + 10, rest: { x: 0, y: hc, z: 0 }, side, back, len: X.glide, outLen: 0.5, creep: T.cam.creep * 0.6, target };
  const orbit = (t) => Math.sin(span(t, X.glide * 0.6, d) * Math.PI * 0.5) * T.lens.near * 0.07 * -side;
  const poseAt = (t) => { const g = glide(t, G0), x = g.x + orbit(t); return [x, g.y, g.z, Math.atan2(-(g.aimX - x), -(g.aimZ - g.z))]; };
  w.city({ items: [logo, name], poses: [poseAt(50), poseAt(0), poseAt(X.glide * 0.4), poseAt(d)], plaza: { r: plazaR, z: plazaZ } });
  const beacon = w.beacon(); w.scene.add(beacon.s);
  const yHandle = specs[1].y + 40 + handle.lead / 2, ySlogan = yHandle + handle.lead / 2 + 6 + (slogan ? slogan.lead / 2 : 0);
  const flat = (ctx, f, y, t0, t, color) => {
    const pin = E(span(t, t0, t0 + 0.35)); if (pin <= 0) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3); ctx.translate(0, (1 - pin) * 24);
    GM.haze(ctx, P, 540 - f.width / 2 - 50, 540 + f.width / 2 + 50, y, f.height + 10, 1);
    ctx.shadowColor = rgba(P.night, 0.8); ctx.shadowBlur = 16;
    kit.drawText(ctx, f, { x0: SAFE.left, x1: SAFE.right, y, align: 'center', color }); ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      const [x, y, z, yaw] = poseAt(t); w.pose(x, y, z, yaw);
      inner.position.y = -(1 - floors(span(t, X.logoUp, X.logoUp + 1.0), 6)) * (logo.maxY + 10);
      name.inner.position.y = -(1 - floors(span(t, X.nameUp, X.nameUp + 0.4), T.floors)) * (name.maxY - name.minY + 8);
      const on = E(span(t, X.lit, X.lit + 0.16)); M.keySide.emissiveIntensity = M.keySideLit * on;
      beacon.at(L, on * (0.55 + 0.45 * Math.cos((t - X.lit) * Math.PI * 1.6)));
      w.render(ctx, t + clock);
      const b = w.screenOf(name.inner); if (b && b[3] - b[2] > 4) kit.rec(...b, brand.name);
      flat(ctx, handle, yHandle, X.handle, t, P.light);
      if (slogan) flat(ctx, slogan, ySlogan, X.slogan, t, P.key);
    },
  };
}
const mix3 = (P) => P.side;
