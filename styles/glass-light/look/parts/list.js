// A list in glass: up to five rows of glass letters, one row turning into the light per beat, each standing on a thin polished glass
// rail; key words are accent glass and cast their coloured pool. The optional title is etched light above.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, mix, SAFE } from '/engine/kit.js';
import { screenBox } from '/engine/three3d.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, J = T.dur.joint, first = clock < 0.01;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const M = await import(look.base + 'motion.js'), { THREE } = M;
  const st = (await import(look.base + 'ground.js')).create({ W, H, brand, look });
  const P = st.P, maxW = SAFE.right - SAFE.left - 40, dir = kit.rtl ? 1 : -1;
  const fits = kit.fitAll(items, { size: T.size.item, weight: 800, maxW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 500, maxW, single: true, where: 'the list title' }) : null;
  const size = fits[0].size, pitch = Math.max(size * 1.85, 150), head = title ? title.lead + 40 : 0;
  const top = kit.place(head + pitch * items.length, 700);
  const mats = { clear: M.glass(P, st.env, 'clear', size * 0.32), key: M.glass(P, st.env, 'key', size * 0.32) };
  const railMat = M.glass(P, st.env, 'clear', 10)[1];
  const rows = [];
  for (let k = 0; k < items.length; k++) {
    const g = await M.glassText(brand, items[k], { size, mats: (kind) => mats[kind] });
    const sy = top + head + k * pitch + pitch / 2, [x, y] = st.at(W / 2, sy);
    g.root.position.set(x, y, 0); st.scene.add(g.root);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 46), railMat);
    rail.position.set(x, y - size * 0.62, 0); rail.visible = false; st.scene.add(rail);
    const pools = g.words.filter((w) => w.key).map((w) => st.patch(P.glow, W / 2 + x + w.x, Math.max(w.width * 1.5, 300), { text: w.text, z: 380 + k * 60 }));
    rows.push({ g, rail, pools, w: g.width, text: fits[k].rows[0].words.map((w) => w.w).join(' ') });
  }
  const yTitle = top + (title ? title.lead / 2 : 0), titleC = mix(P.ground, P.ink, 0.78), out0 = d - J * 0.9;
  const start = (k) => at + 0.1 + k * T.beat;
  return {
    duration: d,
    draw(ctx, t) {
      const sw = M.sweep(t, d, J, W, first);
      st.camera.position.z = T.cam.D * (1 - 0.018 * Math.min(1, t / d));
      rows.forEach((r, k) => {
        const s0 = start(k), n = r.g.words.length;
        r.g.words.forEach((w, i) => {
          M.turnIn(w.group, span(t, s0 + i * 0.07, s0 + i * 0.07 + T.dur.in), dir);
          M.turnOut(w.group, span(t, out0 + k * 0.05, out0 + k * 0.05 + T.dur.out), dir);
        });
        const pr = M.land(span(t, s0 - 0.05, s0 + 0.45)) * (1 - M.away(span(t, out0 + k * 0.05, out0 + k * 0.05 + 0.3)));
        r.rail.visible = pr > 0.001; r.rail.scale.x = Math.max(1, (r.w + 60) * pr);
        r.rail.position.x = r.g.root.position.x + (kit.rtl ? 1 : -1) * (r.w + 60) * (1 - pr) / 2;
        for (const m of r.pools) m.material.opacity = 0.9 * M.soft(span(t, s0 + 0.3, s0 + 0.8)) * (1 - span(t, out0, out0 + 0.4));
      });
      st.draw(ctx, t, sw);
      for (const r of rows) if (r.g.words.some((w) => w.group.visible)) kit.rec(...screenBox(r.g.root, st.camera, W, H), r.text);
      if (title) {
        const a = M.land(span(t, at - 0.1, at + 0.35)) * (1 - M.away(span(t, out0, out0 + 0.35)));
        if (a > 0) { ctx.save(); ctx.globalAlpha = a; kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle + (1 - a) * 14, align: 'center', color: titleC }); ctx.restore(); }
      }
    },
  };
}
