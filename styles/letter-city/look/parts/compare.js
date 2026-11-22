// Before and after, as a block being rebuilt. The old value stands down the street as a grey, tired building; its windows go out,
// then it sinks into the street storey by storey. The new value climbs up nearer the camera in the key colour and its windows switch
// on. The label hangs flat in the sky. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE, rgba } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock = 0, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const GM = await import(look.base + 'ground.js'), G = GM.create({ W, H, brand, look, clock });
  const { floors, glide, E } = await import(look.base + 'motion.js');
  const seed = 11 + Math.round(clock * 10), w = await G.world({ seed }), SL = w.SL, M = w.M;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const plain = (s) => s.replace(/\*/g, '');
  const was = await w.row(plain(asText(S.was)), { mats: () => [M.old, M.oldSide] });
  const now = await w.row(plain(asText(S.now)), { mats: () => [M.keyFace, M.keySide] });
  const maxW = SAFE.right - SAFE.left - 60;
  let size = T.size.compare; for (const r of [was, now]) size = Math.min(size, maxW * SL / r.width);
  const sWas = size * 0.78;
  const label = S.label ? kit.fit(S.label, { size: T.size.label, weight: 600, maxW: SAFE.right - SAFE.left, single: true, where: 'the compare label' }) : null;
  const hW = (was.maxY - was.minY) * sWas / SL, hN = (now.maxY - now.minY) * size / SL, gap = size * 0.35, labelH = label ? label.lead + 50 : 0;
  const top = kit.place(labelH + hW + gap + hN, T.layout.centre);
  const specs = [{ item: was, size: sWas, y: top + labelH + hW }, { item: now, size, y: top + labelH + hW + gap + hN }];
  const { hc } = w.layout(specs, { horizon: specs[0].y - hW * T.layout.horizon });
  for (const r of [was, now]) { w.scene.add(r.root); w.podium(r); }
  w.aim([was, now]);
  const back = T.lens.near * T.cam.back, side = seed % 2 ? 1 : -1, target = { x: 0, z: now.zFront - now.depth * now.s * 0.5 };
  const G0 = { at, d, rest: { x: 0, y: hc, z: 0 }, side, back, len: T.cam.glide, outLen: T.cam.out, creep: T.cam.creep, target };
  const poseAt = (t) => { const g = glide(t, G0); return [g.x, g.y, g.z, Math.atan2(-(g.aimX - g.x), -(g.aimZ - g.z))]; };
  w.city({ items: [was, now], poses: [poseAt(at + 50), poseAt(at), poseAt(at + T.cam.glide * 0.4), poseAt(d - 0.25)] });
  const beacon = w.beacon(); w.scene.add(beacon.s);
  const C = T.compare, oldLit = M.oldSide.emissiveIntensity, yLabel = top + (label ? label.lead / 2 : 0);
  return {
    duration: d,
    draw(ctx, t) {
      const g = glide(t, G0); w.lookAt(g.x, g.y, g.z, g.aimX, g.aimZ);
      const up = floors(span(t, at + C.wasUp, at + C.wasUp + 0.36), T.floors), down = floors(span(t, at + C.sink, at + C.sink + 0.45), T.floors);
      was.inner.position.y = -(1 - up + down) * (was.maxY - was.minY + 8);
      M.oldSide.emissiveIntensity = oldLit * (1 - E(span(t, at + C.dark, at + C.dark + 0.12)));
      const pn = floors(span(t, at + C.nowUp, at + C.nowUp + 0.4), T.floors);
      now.inner.position.y = -(1 - pn) * (now.maxY - now.minY + 8);
      const on = E(span(t, at + C.lit, at + C.lit + 0.14)); M.keySide.emissiveIntensity = M.keySideLit * on;
      beacon.at(now.inner, on * (0.55 + 0.45 * Math.cos((t - at - C.lit) * Math.PI * 1.6)));
      w.render(ctx, t + clock);
      for (const r of [was, now]) { const b = w.screenOf(r.inner); if (b && b[3] - b[2] > 4) kit.rec(...b, r.text); }
      if (label) {
        const pin = E(span(t, at, at + 0.3)), pout = span(t, d - 0.35, d);
        if (pin > 0 && pout < 1) {
          ctx.save(); ctx.globalAlpha = Math.min(1, pin * 3) * (1 - pout); ctx.translate(0, (1 - pin) * 26 - E(pout) * 40);
          GM.haze(ctx, w.P, 540 - label.width / 2 - 50, 540 + label.width / 2 + 50, yLabel + (label.rows.length - 1) * label.lead / 2, label.height + 10, 1);
          ctx.shadowColor = rgba(w.P.night, 0.8); ctx.shadowBlur = 18;
          kit.drawText(ctx, label, { x0: SAFE.left, x1: SAFE.right, y: yLabel, align: 'center', color: w.P.light });
          ctx.restore();
        }
      }
    },
  };
}
