// Before and after as two pieces of evidence: the old value on a short piece of negative film, struck through by a grease-pencil
// line in the accent; then the new value on a catalogue card slid in below it, and the loupe comes down on the new value (seen
// magnified inside the glass, with an accent reading mark). The label is on a tag at the top. Values may be words or numbers.
// spec: { duration, at?, decimals?, says: { was, now, label?, unit? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the compare spec'); need(spec.says, ['was', 'now'], 'the compare spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const asText = (v) => (typeof v === 'number' ? kit.fmt(v, spec.decimals ?? 0) : String(v)) + (S.unit ? ' ' + S.unit : '');
  const maxW = SAFE.right - SAFE.left;
  const [was, now] = kit.fitAll([asText(S.was), asText(S.now)], { size: T.size.compare, weight: 800, maxW: maxW - 140, where: 'a compared value' });
  const label = S.label ? kit.fit(S.label, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 90, single: true, where: 'the compare label' }) : null;
  const pad = T.film.pad, tagH = label ? label.lead + 26 : 0, tagW = label ? label.width + 90 : 0;
  const fh = was.height + pad * 2, fw = Math.min(maxW, was.width + 150), ch = now.height + 70, cw = Math.min(maxW, now.width + 150);
  const cx = W / 2 - cw / 2, nb = M.wordBoxes(kit, now, { x0: cx, x1: cx + cw, y: 0, align: 'center' });
  const nx0 = Math.min(...nb.map((b) => b.x)), nx1 = Math.max(...nb.map((b) => b.x + b.width));
  const r = Math.min(400, Math.max(now.size, ((nx1 - nx0) * T.loupe.mag) / 2 + 40, (now.height * T.loupe.mag) / 2 + 30));
  const gap = Math.max(70, r + 34 - ch / 2);                                     // the loupe on the new value clears the old one
  const top = kit.place(tagH + 40 + fh + gap + ch, 680);
  const yFilm = top + tagH + 40, yCard = yFilm + fh + gap;
  const tagX = rtl ? SAFE.right - tagW : SAFE.left, fx = rtl ? SAFE.right - fw : SAFE.left;
  const yWas = yFilm + pad + was.lead / 2, yNow = yCard + 35 + now.lead / 2;
  const tCut = at + 0.75, tNow = at + 1.1, tLoupe = at + 1.45;
  const nowCard = (ctx, decor) => {
    M.card(ctx, cx, yCard, cw, ch, P, rtl);
    kit.drawText(ctx, now, { x0: cx, x1: cx + cw, y: yNow, align: 'center', color: P.ink, key: P.ink, decor });
    if (decor) { ctx.fillStyle = P.mark; ctx.fillRect(nx0, yNow + now.size * 0.66 + (now.rows.length - 1) * now.lead, nx1 - nx0, Math.max(6, now.size * 0.08)); }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - 0.4, d), dist = W * 1.15;
      if (label) {
        ctx.save(); ctx.translate(M.slide(span(t, at, at + 0.5), out, dist, rtl), 0);
        M.card(ctx, tagX, top, tagW, tagH, P, rtl);
        kit.drawText(ctx, label, { x0: tagX + (rtl ? 26 : 46), x1: tagX + tagW - (rtl ? 46 : 26), y: top + tagH / 2, align: 'start', color: P.soft });
        ctx.restore();
      }
      ctx.save(); ctx.translate(M.slide(span(t, at + 0.1, at + 0.6), out, dist, rtl), 0);
      M.film(ctx, fx, yFilm, fw, fh, P, false);
      kit.drawText(ctx, was, { x0: fx + 75, x1: fx + fw - 75, y: yWas, align: 'center', color: P.filmSoft, key: P.filmSoft });
      const c = span(t, tCut, tCut + 0.35);                                        // the grease pencil, drawn along its length
      if (c > 0) {
        ctx.strokeStyle = P.accent; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath();
        const a = rtl ? fx + fw - 30 : fx + 30, b = rtl ? fx + 30 : fx + fw - 30, ym = yFilm + fh / 2;
        const steps = 24; for (let i = 0; i <= steps * c; i++) { const u = i / steps, x = a + (b - a) * u, y = ym + 18 - 30 * u + Math.sin(u * 9) * 3; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
      ctx.save(); ctx.translate(M.slide(span(t, tNow, tNow + 0.5), out, dist, rtl), 0); nowCard(ctx, false); ctx.restore();
      const creep = Math.sin(t * 0.9) * 6;
      M.loupe(ctx, W / 2 + creep, yCard + ch / 2, r, span(t, tLoupe, tLoupe + 0.6), span(t, d - 0.62, d - 0.27), P, rtl, () => nowCard(ctx, true), T.loupe.mag);
    },
  };
}
