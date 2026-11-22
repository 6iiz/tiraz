// A line as a dialogue in the model town: a dark glass plate with a metal rule settles into the focus band, the lead-in rides on a
// small name plate across its top edge, and the words rise softly into place one after another. The key word (*…*) is lit: it sits
// in a pill of the brand's accent with its own halo. A small diamond breathes in the corner when the line is complete; at the end
// the plate sinks and dims away. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const px = SAFE.left, pw = SAFE.right - SAFE.left, pad = 56, inner = pw - 2 * pad;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: inner, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: pw - 140, minPx: 44, where: 'the lead-in' }) : null;
  const tabH = lead ? lead.height + 26 : 0, tabW = lead ? lead.width + 84 : 0, over = tabH * 0.55;
  const ph = line.height + 2 * pad + (lead ? 18 : 0), top = spec.y ?? kit.place(over + ph, 700), py = top + over;
  const tx = rtl ? px + pw - tabW - 34 : px + 34, yLine = py + pad + (lead ? 18 : 0) + line.lead / 2;
  const n = line.rows.reduce((s, r) => s + r.words.length, 0) + (lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0);
  const st = Math.min(T.dur.stagger, 0.3 / n), w0 = at + 0.15, tDone = w0 + n * st + 0.28, nl = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0;
  const word = (t, k0, f) => (w, i, box, c) => {
    const p = span(t, w0 + (k0 + i) * st, w0 + (k0 + i) * st + 0.28);
    if (M.rise(c, p, f.size) === false) return false;
    if (w.key) { M.keyPill(c, box, f.size, P); return P.onA; }
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pin = M.out3(span(t, at, at + 0.3)), pout = M.in2(span(t, d - 0.35, d));
      if (pin <= 0 || pout >= 1) return;
      ctx.save(); ctx.globalAlpha = 1 - pout; ctx.translate(0, (1 - pin) * 26 + pout * 22);
      M.plate(ctx, px, py, pw, ph, P, pin);
      if (lead) {
        M.plate(ctx, tx, top, tabW, tabH, P, M.out3(span(t, at + 0.08, at + 0.36)));
        kit.drawText(ctx, lead, { x0: tx + 42, x1: tx + tabW - 42, y: top + 13 + lead.lead / 2, align: 'start', color: P.metal, key: P.metal, each: word(t, 0, lead) });
      }
      kit.drawText(ctx, line, { x0: px + pad, x1: px + pw - pad, y: yLine, align: 'start', color: P.l, key: P.l, each: word(t, nl, line) });
      if (t > tDone) {                                                     // the "go on" diamond breathes
        const a = 0.55 + 0.45 * Math.sin((t - tDone) * 5), x = rtl ? px + 34 : px + pw - 34, y = py + ph - 30;
        ctx.globalAlpha *= a; ctx.fillStyle = P.metal; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 7, y); ctx.fill();
      }
      ctx.restore();
    },
  };
}
