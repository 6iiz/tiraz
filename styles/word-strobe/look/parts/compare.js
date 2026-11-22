// Before and after as two cards on the stair: the old value cuts in on a paper field; on the strike, its field is cut away to a thin
// paper frame, the words drop to grey and one hard accent bar is laid across them (no animation, a cut). A beat later the new value
// cuts in larger on an accent field, and the strobe behind starts repeating it. spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, room: 'stairs' });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10;
  const was = kit.fit(asText(S.was), { size: T.size.compare * 0.8, weight: 800, maxW: x1 - x0 - 40, where: 'the old value' });
  const now = kit.fit(asText(S.now), { size: T.size.compare * 1.15, weight: 900, maxW: x1 - x0 - 40, where: 'the new value' });
  const label = S.label ? M.balanced(kit, S.label, { size: T.size.lead, weight: T.weight.lead, maxW: x1 - x0 - 40, minScale: 0.92, minPx: 44, where: 'the compare label' }) : null;
  const labH = label ? label.height + 40 : 0, gap = 70;
  const top = kit.place(labH + was.height + gap + now.height, 680);
  const yWas = top + labH + was.lead / 2, yNow = top + labH + was.height + gap + now.lead / 2;
  const tWas = at + 0.15, tCut = at + 0.8, tNow = tCut + T.beat;
  const giants = M.giantsOf(kit, asText(S.now), T, brand.fonts.display.family);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t, t / d);
      const off = M.gone(t, d, 3, T);
      if (t >= tNow + 0.1 && off === 0) M.ghost(ctx, kit, W, giants, Math.floor((t - tNow - 0.1) / T.beat), pal.ghostKey);
      if (label && t >= at && off < 3) {
        ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? W - 34 : 0, top + label.lead * 0.15, 34, label.height - label.lead * 0.3);
        kit.drawText(ctx, label, { x0, x1, y: top + label.lead / 2, align: 'start', color: pal.paper });
      }
      if (t >= tWas && off < 2) {
        const struck = t >= tCut;
        for (const b of M.rowBoxes(kit, was, x0, x1, yWas)) {
          M.field(ctx, W, b, was.size, M.opens(t, tWas, T), pal.paper, rtl);
          if (struck) M.field(ctx, W, { ...b, x0: b.x0 + 6, x1: b.x1 - 6 }, was.size * 0.9, 1, pal.ink, rtl);   // cut away to a frame
        }
        if (t >= tWas + 2 * T.frame) kit.drawText(ctx, was, { x0, x1, y: yWas, align: 'start', color: struck ? pal.struck : pal.ink, key: struck ? pal.struck : pal.ink });
        if (struck) { const bw = was.width + 60; ctx.fillStyle = pal.accent; ctx.fillRect(rtl ? x1 - was.width - 30 : x0 - 30, yWas - 8 + (was.rows.length - 1) * was.lead / 2, bw, 16); }
      }
      if (t >= tNow && off < 1) {
        for (const b of M.rowBoxes(kit, now, x0, x1, yNow)) M.field(ctx, W, b, now.size, M.opens(t, tNow, T), pal.accent, rtl);
        if (t >= tNow + 2 * T.frame) kit.drawText(ctx, now, { x0, x1, y: yNow, align: 'start', color: pal.onAccent, key: pal.onAccent });
      }
    },
  };
}
