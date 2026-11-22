// A line as evidence: the statement is printed on a strip of negative film (light letters on the dark base) that is slid onto the
// table from the reading side; the lead-in is on a small catalogue tag above it. Then the loupe comes down on the key word (*…*):
// inside the glass the strip is seen magnified and positive, ink on light, with an accent reading mark under the word. An accent
// notch on the film's edge marks the key word from outside the glass too. spec: { duration, at?, y?, cut?, says: { text, lead? } }
//   cut: true only makes the exit quicker (the strip is pulled off without waiting for the loupe to rise far).
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: maxW - 20, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 90, single: true, where: 'the lead-in' }) : null;
  const x0 = SAFE.left + 10, x1 = SAFE.right - 10, pad = T.film.pad;
  const boxes = M.wordBoxes(kit, line, { x0, x1, y: 0, align: 'start' });
  const kb = { ...(boxes.find((b) => b.key) ?? boxes[boxes.length - 1]) };
  const kcx = kb.x + kb.width / 2, r = Math.max(line.size * 0.9, Math.min(330, kb.width * 0.62 + line.size * 0.4));
  // the tag sits far enough above the strip that the loupe, resting on the key word, never covers it
  const tagH = lead ? lead.lead + 26 : 0, gap = lead ? Math.max(30, r + 34 - (pad + line.lead / 2 + kb.row * line.lead)) : 0, stripH = line.height + pad * 2;
  const top = spec.y ?? kit.place(tagH + gap + stripH, 640);
  const yStrip = top + tagH + gap, yText = yStrip + pad + line.lead / 2;
  kb.y = yText + kb.row * line.lead;
  const tagW = lead ? lead.width + 90 : 0, tagX = rtl ? SAFE.right - tagW : SAFE.left;
  const tIn = at, tLoupe = at + 0.7, tUp = d - (spec.cut ? 0.45 : 0.62), tOut = d - (spec.cut ? 0.32 : 0.4);

  const strip = (ctx, sx, positive) => {
    ctx.save(); ctx.translate(sx, 0);
    M.film(ctx, -80, yStrip, W + 160, stripH, P, positive);
    ctx.fillStyle = P.accent;                                                      // the edge notch over the key word
    ctx.beginPath(); ctx.moveTo(kcx - 16, yStrip); ctx.lineTo(kcx + 16, yStrip); ctx.lineTo(kcx, yStrip + 14); ctx.closePath(); ctx.fill();
    kit.drawText(ctx, line, { x0, x1, y: yText, align: 'start', color: positive ? P.ink : P.filmText, key: positive ? P.ink : P.filmText, decor: positive });
    if (positive) { ctx.fillStyle = P.mark; ctx.fillRect(kb.x - 4, kb.y + line.size * 0.66, kb.width + 8, Math.max(6, line.size * 0.08)); }
    ctx.restore();
  };
  const tag = (ctx, tx, decor) => {
    if (!lead) return;
    ctx.save(); ctx.translate(tx, 0);
    M.card(ctx, tagX, top, tagW, tagH, P, rtl);
    kit.drawText(ctx, lead, { x0: tagX + (rtl ? 46 : 26), x1: tagX + tagW - (rtl ? 26 : 46), y: top + tagH / 2, align: 'start', color: P.soft, decor });
    ctx.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const sx = M.slide(span(t, tIn, tIn + 0.55), span(t, tOut, d), W * 1.15, rtl);
      const tx = M.slide(span(t, tIn + 0.12, tIn + 0.6), span(t, tOut + 0.05, d), W * 1.15, rtl);
      tag(ctx, tx, false);
      strip(ctx, sx, false);
      const creep = Math.sin(t * 0.9) * 6;                                          // the hand on the loupe never quite stops
      M.loupe(ctx, kcx + sx + creep, kb.y, r, span(t, tLoupe, tLoupe + 0.6), span(t, tUp, tUp + 0.35), P, rtl, () => { tag(ctx, tx, true); strip(ctx, sx, true); }, T.loupe.mag);
    },
  };
}
