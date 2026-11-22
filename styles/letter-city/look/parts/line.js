// A line: the words are towers of one block. The camera comes down the street towards them, turning square to their fronts; each
// word climbs out of the street floor by floor in reading order, the key word (*…*) last and tallest, in the accent, and its windows
// switch on when it tops out (a beacon blinks on its roof). The optional lead hangs in the dusk sky above, flat.
// spec: { duration, at?, says: { text, lead? } }      (a long text wraps into a near row and a far row of towers)
import { need, span, SAFE, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration;
  const GM = await import(look.base + 'ground.js'), G = GM.create({ W, H, brand, look, clock });
  const { floors, glide, E } = await import(look.base + 'motion.js');
  const seed = 3 + Math.round(clock * 10), w = await G.world({ seed }), SL = w.SL;
  const maxW = SAFE.right - SAFE.left - 60;

  // rows: measured flat first (same face), then built as towers; every row gets one on-screen size
  const fit = kit.fit(spec.says.text, { size: T.size.line, weight: 800, maxW: maxW / 1.1, minScale: 0.72, where: 'the line' });
  const rows = [];
  for (const r of fit.rows) rows.push(await w.row(r.words.map((x) => (x.key ? `*${x.w}*` : x.w)).join(' ')));
  let size = fit.size; for (const r of rows) size = Math.min(size, maxW * SL / r.width);
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the lead-in' }) : null;
  const hpx = rows.map((r) => (r.maxY - r.minY) * size / SL), gap = size * 0.3, leadH = lead ? lead.lead + 50 : 0;
  const top = kit.place(leadH + hpx.reduce((a, b) => a + b, 0) + gap * (rows.length - 1), T.layout.centre);
  let y = top + leadH;
  const specs = rows.map((r, i) => { y += hpx[i]; const o = { item: r, size, y }; y += gap; return o; });
  const { hc } = w.layout(specs, { horizon: specs[0].y - hpx[0] * T.layout.horizon });
  for (const r of rows) { w.scene.add(r.root); w.podium(r); }
  w.aim(rows);

  const near = rows.at(-1), back = T.lens.near * T.cam.back, side = seed % 2 ? 1 : -1;
  const target = { x: 0, z: near.zFront - near.depth * near.s * 0.5 };
  const G0 = { at, d, rest: { x: 0, y: hc, z: 0 }, side, back, len: T.cam.glide, outLen: T.cam.out, creep: T.cam.creep, target };
  const poseAt = (t) => { const g = glide(t, G0); return [g.x, g.y, g.z, Math.atan2(-(g.aimX - g.x), -(g.aimZ - g.z))]; };
  w.city({ items: rows, poses: [poseAt(at + 50), poseAt(at), poseAt(at + T.cam.glide * 0.4), poseAt(d - 0.25)] });

  // timing: words rise in reading order inside a fixed window (so a hook is whole 0.8 s in)
  const all = rows.flatMap((r) => r.words), n = all.length, rise = T.dur.rise;
  const stg = n > 1 ? Math.min(T.dur.stagger, (T.dur.window - rise) / (n - 1)) : 0;
  const t0 = (k) => at + 0.05 + k * stg;
  const keys = all.map((x, k) => (x.key ? k : -1)).filter((k) => k >= 0), tLit = keys.length ? t0(Math.max(...keys)) + rise + 0.12 : null;
  const beacon = w.beacon(); if (keys.length) w.scene.add(beacon.s);
  const yLead = top + (lead ? lead.lead / 2 : 0);

  return {
    duration: d,
    draw(ctx, t) {
      const g = glide(t, G0); w.lookAt(g.x, g.y, g.z, g.aimX, g.aimZ);
      all.forEach((x, k) => { const p = floors(span(t, t0(k), t0(k) + rise), T.floors); x.group.position.y = x.y - (1 - p) * (x.hi - x.lo + 8); });
      if (tLit != null) {
        const on = E(span(t, tLit, tLit + 0.14)); w.M.keySide.emissiveIntensity = w.M.keySideLit * on;
        beacon.at(all[keys[0]].group, on * (0.55 + 0.45 * Math.cos((t - tLit) * Math.PI * 2 * 0.8)));
      }
      w.render(ctx, t + clock);
      rows.forEach((r) => { const b = w.screenOf(r.inner); if (b && b[3] - b[2] > 4) kit.rec(...b, r.text); });
      if (lead) {
        const pin = E(span(t, at, at + 0.3)), pout = span(t, d - 0.35, d);
        if (pin > 0 && pout < 1) {
          ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3) * (1 - pout); ctx.translate(0, (1 - pin) * 26 - E(pout) * 40);
          GM.haze(ctx, w.P, 540 - lead.width / 2 - 50, 540 + lead.width / 2 + 50, yLead, lead.height + 10, 1);
          ctx.shadowColor = rgba(w.P.night, 0.8); ctx.shadowBlur = 18;
          kit.drawText(ctx, lead, { x0: SAFE.left, x1: SAFE.right, y: yLead, align: 'center', color: w.P.light });
          ctx.restore();
        }
      }
    },
  };
}
