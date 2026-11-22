// Before and after on the grid: the old value slides in grey on its row, an ink rule cuts along it from the reading side, and the
// row sinks into the floor with its stage. Then the new value's stage rises two rows lower, it slides in in ink, and the accent
// unit locks at its far end. Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, HT = T.height, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 });
  const { E } = await import(look.base + 'motion.js');
  const THREE = W3.THREE, cols = T.grid.cols, P = W3.P, maxW = SAFE.right - SAFE.left;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - P, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 30, single: true, where: 'the compare label' }) : null;
  const n = (label ? 1 : 0) + 3, j0 = Math.max(0, Math.min(W3.rows - n - 1, Math.round((680 - SAFE.top) / P - n / 2)));
  const jWas = j0 + (label ? 1 : 0), jNow = jWas + 2;
  const cutT = at + 0.85, sinkT = cutT + 0.3, nowT = at + 1.45, out0 = d - T.dur.out;
  const lab = label ? await W3.slab(S.label, { size: label.size, weight: T.weight.lead, depth: T.depth.lead, color: W3.tone.grey }) : null;
  const ws = await W3.slab(asText(S.was), { size: was.size, weight: 800, color: W3.tone.grey, maxW: maxW - P });
  const nw = await W3.slab(asText(S.now), { size: now.size, weight: 800, maxW: maxW - P });
  if (lab) W3.place(lab, { row: j0 });
  W3.place(ws, { row: jWas }); W3.place(nw, { row: jNow });
  // the cut: an ink rule on the old value's face, growing from the reading side
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: W3.tone.ink, roughness: 0.6 }));
  bar.castShadow = true; bar.visible = false; ws.root.add(bar);
  const lenAll = ws.x1 - ws.x0 + 24;
  const up = (t0, t1) => (t) => HT.rest + (HT.stage - HT.rest) * E(span(t, t0, t0 + 0.24)) * (1 - E(span(t, t1, t1 + 0.28)));
  const zLab = up(at - 0.1, out0), zWas = up(at, sinkT), zNow = up(nowT - 0.28, out0);
  [[lab, zLab], [ws, zWas], [nw, zNow]].forEach(([sl, z]) => { if (sl) for (let i = sl.i0; i <= sl.i1; i++) W3.stage(i, sl.row, z); });
  const po = {
    lab: { t0: at + 0.05, step: T.dur.step, slide: T.dur.slide, out0, out1: d, z: zLab },
    was: { t0: at + 0.25, step: T.dur.step, slide: T.dur.slide, out0: sinkT, out1: sinkT + 0.4, z: zWas },
    now: { t0: nowT, step: T.dur.step, slide: T.dur.slide, out0, out1: d, z: zNow },
  };
  W3.reserve(0, cols - 1, j0, jNow);
  // the accent unit locks at the far end of the new value's row (or under it when the row is full)
  const free = W3.rtl ? nw.i0 > 0 : nw.i1 < cols - 1;
  const ui = W3.rtl ? (free ? nw.i0 - 1 : 0) : (free ? nw.i1 + 1 : cols - 1), uj = free ? jNow : jNow + 1, uc = W3.cell(ui, uj);
  W3.stage(ui, uj, () => 0);
  return {
    duration: d,
    draw(ctx, t) {
      if (lab) W3.pose(lab, t, po.lab);
      W3.pose(ws, t, po.was);
      const q = E(span(t, cutT, cutT + 0.25)), len = lenAll * q;
      bar.visible = q > 0 && t < sinkT + 0.4;
      bar.scale.set(Math.max(0.01, len), ws.size * 0.075, ws.depth * 0.6);
      bar.position.set(W3.rtl ? ws.x1 + 12 - len / 2 : ws.x0 - 12 + len / 2, 0, ws.depth + ws.depth * 0.3);
      W3.pose(nw, t, po.now);
      W3.placeUnit(uc.x, uc.y, HT.unit * E(span(t, nowT + 0.3, nowT + 0.55)) * (1 - E(span(t, out0, d))));
      W3.draw(ctx, t);
    },
  };
}
