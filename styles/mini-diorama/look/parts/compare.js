// Before and after: the old value hangs on a greyed board; a strip of tape is pulled across it, then one of its wires gives and
// it drops to hang crooked (still readable). The new value falls into place under it on an accent board.
// Values may be words or numbers. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const R3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 + Math.round(clock) });
  const { E, crooked } = await import(look.base + 'motion.js');
  const THREE = R3.THREE, rg = R3.region, tn = R3.tn, pad = 2 * T.sign.padX;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: rg.w - pad - 60, single: true, lead: 1.25, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: 600, maxW: rg.w - pad - 40, single: true, lead: 1.3, where: 'the compare label' }) : null;
  const bw = R3.boardSize(was), bn = R3.boardSize(now), wv = Math.max(bw.w, bn.w, 380), bl = label ? R3.boardSize(label) : null;
  const hs = [...(label ? [bl.h] : []), bw.h, bn.h];
  const ys = R3.stack(hs, T.layout.centre, 34);
  const plain = (f) => f.rows.map((r) => r.words.map((x) => x.w).join(' ')).join(' ');
  const j = label ? 1 : 0;
  const lab = label ? R3.sign({ cx: rg.cx, cy: ys[0], wpx: bl.w, hpx: bl.h, depth: 12, paint: R3.textPaint(label, {}), text: plain(label) }) : null;
  const old = R3.sign({ cx: rg.cx, cy: ys[j], wpx: wv, hpx: bw.h, paint: R3.textPaint(was, { color: tn.oldBoard, ink: tn.old, keyOff: true }), text: plain(was) });
  const nw = R3.sign({ cx: rg.cx, cy: ys[j + 1], wpx: wv, hpx: bn.h, depth: 20, side: tn.frame, paint: R3.textPaint(now, { color: tn.accent, ink: tn.keyInk, frame: tn.frame, keyOff: true }), text: plain(now) });
  // the tape: a thin strip on the old board's face, pulled from the reading side
  const tape = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2), new THREE.MeshStandardMaterial({ color: tn.ink, roughness: 0.7 }));
  tape.visible = false; old.board.add(tape);
  const full = old.ww * (was.width + 70) / wv, th = old.hh * was.size * 0.11 / bw.h, dz = old.board.geometry.parameters.depth / 2 + 1.5, dir = R3.rtl ? -1 : 1;
  const tCut = at + 0.75, tDrop = at + 1.15, tNow = at + 1.45;
  return {
    duration: d,
    draw(ctx, t) {
      if (lab) lab.pose(t, at - 0.05);
      // the wire on the far side gives: the board hangs from the reading-side wire, crooked
      const tilt = crooked(t - tDrop, dir * -0.13);
      old.pose(t, at + 0.08, { tilt });
      if (old.wires.length) old.wires[R3.rtl ? 0 : 1].visible = t < tDrop;
      const q = E(span(t, tCut, tCut + T.dur.strike)), len = Math.max(0.01, full * q);
      tape.visible = q > 0; tape.scale.set(len, th, 1); tape.rotation.z = -0.05 * dir;
      tape.position.set(-dir * (full / 2 - len / 2), old.hh * 0.07, dz);
      nw.pose(t, tNow);
      R3.draw(ctx, t);
      if (lab) lab.rec(); old.rec(); nw.rec();
    },
  };
}
