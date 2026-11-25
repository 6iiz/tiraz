// Before and after, as a re-priced tag: the label on a small tag, then the old value on a paper tag. A marker line strikes the old
// value through from the reading side (it stays readable under the line), and the new value swings in on an accent tag below it,
// the way a shop hangs the new price under the old one. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, fam = brand.fonts.display.family;
  const W3 = await (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock, kit, seed: 3 });
  const { E } = await import(look.base + 'motion.js');
  await W3.fonts([[800, T.size.compare, fam], [T.weight.lead, T.size.lead, fam]]);
  const tone = W3.tone, THREE = W3.THREE;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: W3.textMax - 2 * T.tag.keyPad, single: true, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: W3.textMax, single: true, where: 'the compare label' }) : null;
  const tags = [];
  const lab = label ? W3.textTag(label.rows[0], label, { color: tone.grey, high: T.high.lead }) : null;
  if (lab) tags.push(lab);
  const ws = W3.textTag(was.rows[0], was, { color: tone.old, high: T.high.compare });
  const nw = W3.textTag(now.rows[0], now, { color: tone.onAccent, body: tone.accent, keyFill: tone.paper, keyInk: tone.ink, high: T.high.compare });
  tags.push(ws, nw);
  W3.hang(tags, { centre: 680, gap: 30 });
  // the strike: a marker line in the print colour across the old value, drawn from the reading side
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: tone.ink, roughness: 0.5 }));
  bar.visible = false; ws.content.add(bar);
  const sx0 = ws.local.x0 - 6, sx1 = ws.local.x1 + 6, len0 = sx1 - sx0, thick = was.size * 0.085;
  const strikeT = at + 0.75, nowT = at + 1.1, out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      if (lab) W3.swing(lab, t, { t0: at, out0: out0 - 0.1 });
      W3.swing(ws, t, { t0: at + 0.08, out0: out0 - 0.05 });
      const q = E(span(t, strikeT, strikeT + 0.22)), len = len0 * q;
      bar.visible = q > 0;
      bar.scale.set(Math.max(0.01, len), thick, 2.5);
      bar.position.set(W3.rtl ? sx1 - len / 2 : sx0 + len / 2, ws.h * 0.02, ws.local.z + 1.5);
      bar.rotation.z = -0.035 * W3.b;
      W3.swing(nw, t, { t0: nowT, out0 });
      W3.draw(ctx, t);
    },
  };
}
