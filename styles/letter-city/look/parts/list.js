// A list: a row of buildings down the avenue, seen from above the rooftops. Each item is one building, the first far down the street,
// the last nearest; they climb out of the street one per beat, floor by floor. A key word in an item stands in the key colour and
// its windows switch on. The optional title hangs flat in the sky over the horizon.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const GM = await import(look.base + 'ground.js'), G = GM.create({ W, H, brand, look, clock });
  const { floors, glide, E } = await import(look.base + 'motion.js');
  const seed = 9 + Math.round(clock * 10), w = await G.world({ seed }), SL = w.SL;
  const maxW = SAFE.right - SAFE.left - 60;
  const fits = kit.fitAll(items, { size: T.size.item, weight: 800, maxW: maxW / 1.1, single: true, where: 'a list item' });
  const rows = []; for (const it of items) rows.push(await w.row(it));
  let size = fits[0].size; for (const r of rows) size = Math.min(size, maxW * SL / r.width);
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const hpx = rows.map((r) => (r.maxY - r.minY) * size / SL), gap = Math.max(24, size * 0.34), titleH = title ? title.lead + 46 : 0;
  const top = kit.place(titleH + hpx.reduce((a, b) => a + b, 0) + gap * (rows.length - 1), T.layout.centre);
  let y = top + titleH;
  const specs = rows.map((r, i) => { y += hpx[i]; const o = { item: r, size, y }; y += gap; return o; });
  // the horizon sits above the whole list: the rows are all below it, so the far ones are not much farther than the near ones
  const { hc } = w.layout(specs, { horizon: top + titleH - Math.max(40, hpx[0] * 0.5) });
  for (const r of rows) { w.scene.add(r.root); w.podium(r); }
  w.aim(rows);
  const near = rows.at(-1), back = T.lens.near * T.cam.back, side = seed % 2 ? 1 : -1;
  const target = { x: 0, z: near.zFront - near.depth * near.s * 0.5 };
  const G0 = { at, d, rest: { x: 0, y: hc, z: 0 }, side, back, len: T.cam.glide, outLen: T.cam.out, creep: T.cam.creep, target };
  const poseAt = (t) => { const g = glide(t, G0); return [g.x, g.y, g.z, Math.atan2(-(g.aimX - g.x), -(g.aimZ - g.z))]; };
  w.city({ items: rows, poses: [poseAt(at + 50), poseAt(at), poseAt(at + T.cam.glide * 0.4), poseAt(d - 0.25)] });

  const t0 = (k) => at + 0.2 + k * T.dur.beat, rise = 0.4;
  const firstKey = rows.findIndex((r) => r.words.some((x) => x.key)), tLit = firstKey >= 0 ? t0(firstKey) + rise + 0.1 : null;
  const yTitle = top + (title ? title.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      const g = glide(t, G0); w.lookAt(g.x, g.y, g.z, g.aimX, g.aimZ);
      rows.forEach((r, k) => { const p = floors(span(t, t0(k), t0(k) + rise), T.floors); r.inner.position.y = -(1 - p) * (r.maxY - r.minY + 8); });
      if (tLit != null) w.M.keySide.emissiveIntensity = w.M.keySideLit * E(span(t, tLit, tLit + 0.14));
      w.render(ctx, t + clock);
      rows.forEach((r) => { const b = w.screenOf(r.inner); if (b && b[3] - b[2] > 4) kit.rec(...b, r.text); });
      if (title) {
        const pin = E(span(t, at, at + 0.3)), pout = span(t, d - 0.35, d);
        if (pin > 0 && pout < 1) {
          ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3) * (1 - pout); ctx.translate(0, (1 - pin) * 26 - E(pout) * 40);
          GM.haze(ctx, w.P, 540 - title.width / 2 - 50, 540 + title.width / 2 + 50, yTitle, title.height + 10, 1);
          ctx.shadowColor = rgba(w.P.night, 0.8); ctx.shadowBlur = 18;
          kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle, align: 'center', color: w.P.light });
          ctx.restore();
        }
      }
    },
  };
}
