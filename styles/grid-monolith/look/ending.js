// The grid-monolith ending, the one exception of the system. The accent unit rises in its cell at the far corner, then breaks out
// of the grid: one straight, linear, unsnapped move across the floor (with one short pause), growing as it goes, onto a raised
// two-by-two stage at the reading side. There it sinks into the stage while the brand's logo is extruded out of the same
// footprint: the unit becomes the logo. The name, a rule, the handle (mono) and the slogan slide in on their rows.
// spec: { duration }
import { need, span, lerp, SAFE } from '/engine/kit.js';
import { logo3d } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration'], 'the ending spec');
  const T = look.tokens, HT = T.height, d = spec.duration;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 5 });
  const { E } = await import(look.base + 'motion.js');
  const THREE = W3.THREE, cols = T.grid.cols, P = W3.P, maxW = SAFE.right - SAFE.left, rtl = W3.rtl;
  const j0 = 0, li = rtl ? cols - 2 : 0;                                    // the logo's 2x2 cells
  const name = await W3.slab(brand.name, { size: T.size.name, weight: 800 });
  const handle = await W3.slab(brand.handle, { size: T.size.handle, weight: 500, face: 'mono', depth: T.depth.lead, ltr: true });
  const slogan = brand.slogan?.length ? await W3.slab(brand.slogan.join(' '), { size: T.size.slogan, weight: 600, depth: T.depth.lead, color: W3.tone.grey }) : null;
  W3.place(name, { row: j0 + 2 }); W3.place(handle, { row: j0 + 3 }); if (slogan) W3.place(slogan, { row: j0 + 4 });
  const up = (t0, h = HT.stage) => (t) => HT.rest + (h - HT.rest) * E(span(t, t0, t0 + 0.26));
  const zLogo = up(0.9), zName = up(1.45), zHandle = up(1.75), zSlogan = up(1.95);
  for (let i = li; i <= li + 1; i++) for (const j of [j0, j0 + 1]) W3.stage(i, j, zLogo);
  [[name, zName], [handle, zHandle], [slogan, zSlogan]].forEach(([sl, z]) => { if (sl) for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, sl.row, z); });
  W3.reserve(0, cols - 1, j0, j0 + 4);
  // the rule under the name: a thin ink bar that grows from the reading side along the row line
  const rule = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: W3.tone.ink, roughness: 0.6 }));
  rule.castShadow = true; rule.visible = false; W3.scene.add(rule);
  const yRule = W3.wy(SAFE.top + (j0 + 3) * P), ruleW = maxW;
  // the logo, the same width as the 2x2 stage
  const side2 = 2 * P - (P - W3.side), logo = logo3d(brand, { size: side2 * 0.86, depth: T.depth.logo, bevel: 2 });
  { const b = new THREE.Box3().setFromObject(logo), k = side2 * 0.94 / Math.max(b.max.x - b.min.x, b.max.y - b.min.y); logo.children[0].scale.x *= k; logo.children[0].scale.y *= k; }
  logo.visible = false; W3.scene.add(logo);
  const lx = W3.wx(SAFE.left + (li + 1) * P), ly = W3.wy(SAFE.top + (j0 + 1) * P);
  // the unit's start: the far bottom cell of the composition
  const sc = W3.cell(rtl ? 0 : cols - 1, j0 + 5); W3.stage(sc.i, sc.j, () => 0);
  const from = { x: sc.x, y: sc.y, z: 0, s: 1, h: HT.unit }, to = { x: lx, y: ly, z: HT.stage, s: side2 / W3.side, h: HT.unit * 0.9 };
  const pLogo = (t) => E(span(t, 1.25, 1.65));
  return {
    duration: d,
    draw(ctx, t) {
      const sit = E(span(t, 0, 0.3));
      const raw = span(t, 0.45, 1.2), fly = raw < 0.45 ? raw : raw < 0.6 ? 0.45 : (raw - 0.15) / 0.85;   // linear, with one pause
      const q = pLogo(t);
      const x = lerp(from.x, to.x, fly), y = lerp(from.y, to.y, fly), z0 = lerp(from.z, to.z, fly) , s = lerp(from.s, to.s, fly);
      const z = fly >= 1 ? zLogo(t) : z0;
      W3.placeUnit(x, y, from.h * sit * (1 - q), s, z);
      logo.visible = q > 0;
      logo.position.set(lx, ly, zLogo(t) + T.depth.logo * q / 2); logo.scale.set(1, 1, Math.max(0.01, q));
      W3.pose(name, t, { t0: 1.6, step: T.dur.step, slide: T.dur.slide, out0: 99, out1: 100, z: zName });
      const rq = E(span(t, 1.8, 2.2)); rule.visible = rq > 0;
      rule.scale.set(Math.max(0.01, ruleW * rq), 3, 6); rule.position.set(W3.wx(rtl ? SAFE.right - ruleW * rq / 2 : SAFE.left + ruleW * rq / 2), yRule, zHandle(t) + 3);
      W3.pose(handle, t, { t0: 1.95, step: T.dur.step, slide: T.dur.slide, out0: 99, out1: 100, z: zHandle });
      if (slogan) W3.pose(slogan, t, { t0: 2.15, step: T.dur.step, slide: T.dur.slide, out0: 99, out1: 100, z: zSlogan });
      W3.draw(ctx, t);
    },
  };
}
